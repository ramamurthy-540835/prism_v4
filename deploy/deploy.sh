#!/usr/bin/env bash
set -euo pipefail
PROJECT=aidirac-503309; REGION=us-central1; BUCKET=aidirac-503309-prism-knowledge; TOPIC=prism-knowledge-ingest; SA=prism-knowledge-sa
gcloud services enable run.googleapis.com cloudbuild.googleapis.com pubsub.googleapis.com eventarc.googleapis.com storage.googleapis.com --project "$PROJECT"
gcloud storage buckets create "gs://$BUCKET" --project "$PROJECT" --location "$REGION" --uniform-bucket-level-access || true
gcloud pubsub topics create "$TOPIC" --project "$PROJECT" || true
gcloud iam service-accounts create "$SA" --project "$PROJECT" || true
gcloud run deploy prism-web --source . --project "$PROJECT" --region "$REGION" --allow-unauthenticated --set-env-vars "GCP_PROJECT=$PROJECT,BQ_DATASET=prism_prompt_catalog"
gcloud run deploy prism-api --source . --project "$PROJECT" --region "$REGION" --allow-unauthenticated --command sh --args '-c,python3 -m uvicorn backend.app:app --host 0.0.0.0 --port ${PORT}' --set-env-vars "GCP_PROJECT=$PROJECT,GCP_REGION=$REGION,BQ_DATASET=prism_prompt_catalog,KNOWLEDGE_BUCKET=$BUCKET,INGEST_TOPIC=$TOPIC,INGEST_JOB_NAME=prism-ingest"
gcloud run jobs create prism-ingest --image "$(gcloud run services describe prism-api --project "$PROJECT" --region "$REGION" --format='value(spec.template.spec.containers[0].image)')" --project "$PROJECT" --region "$REGION" --command python3 --args -m,knowledge.ingest.main --set-env-vars "GCP_PROJECT=$PROJECT,GCP_REGION=$REGION,BQ_DATASET=prism_prompt_catalog,KNOWLEDGE_BUCKET=$BUCKET" || gcloud run jobs update prism-ingest --image "$(gcloud run services describe prism-api --project "$PROJECT" --region "$REGION" --format='value(spec.template.spec.containers[0].image)')" --project "$PROJECT" --region "$REGION"
API_URL=$(gcloud run services describe prism-api --project "$PROJECT" --region "$REGION" --format='value(status.url)')
gcloud eventarc triggers create prism-knowledge-ingest --project "$PROJECT" --location "$REGION" --destination-run-service=prism-api --destination-run-region="$REGION" --destination-run-path=/api/knowledge/internal/ingest-event --event-filters="type=google.cloud.pubsub.topic.v1.messagePublished" --transport-topic="$TOPIC" || true
echo "API: $API_URL"
