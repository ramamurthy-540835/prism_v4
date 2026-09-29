from __future__ import annotations

from datetime import datetime, timedelta, timezone

from google.cloud import bigquery, storage

from ..ingest.config import Settings


def soft_delete_expired(bq: bigquery.Client, settings: Settings = Settings()) -> int:
    job = bq.query(f"""
      UPDATE `{settings.table_prefix}.documents`
      SET status='deleted', deleted_at=CURRENT_TIMESTAMP(), status_detail='retention_expired'
      WHERE deleted_at IS NULL AND expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP()
    """)
    job.result()
    return int(job.num_dml_affected_rows or 0)


def hard_delete_due(bq: bigquery.Client, gcs: storage.Client, settings: Settings = Settings(), now: datetime | None = None) -> int:
    now = now or datetime.now(timezone.utc)
    cutoff = now - timedelta(days=7)
    rows = bq.query(f"SELECT document_id, gcs_uri FROM `{settings.table_prefix}.documents` WHERE deleted_at <= @cutoff", job_config=bigquery.QueryJobConfig(query_parameters=[bigquery.ScalarQueryParameter("cutoff", "TIMESTAMP", cutoff)])).result()
    deleted = 0
    for row in rows:
        bucket, name = row["gcs_uri"][5:].split("/", 1)
        gcs.bucket(bucket).blob(name).delete(if_generation_match=None)
        for table in ("document_retrieval", "document_chunks", "document_acl", "documents"):
            bq.query(f"DELETE FROM `{settings.table_prefix}.{table}` WHERE document_id=@document_id", job_config=bigquery.QueryJobConfig(query_parameters=[bigquery.ScalarQueryParameter("document_id", "STRING", row["document_id"])])).result()
        deleted += 1
    return deleted
