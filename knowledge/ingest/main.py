from __future__ import annotations

import base64
import hashlib
import json
import uuid
from datetime import datetime, timezone

from google.cloud import bigquery, storage

from .chunk import chunk_blocks
from .config import Settings
from .dlp import DlpScanner
from .embed import Embedder
from .extract import ExtractionError, extract_bytes, extract_with_document_ai
from .integrity import verify_document
from .load import Loader


class IngestionPipeline:
    def __init__(self, settings: Settings = Settings()):
        self.settings = settings
        self.bq = bigquery.Client(project=settings.project)
        self.storage = storage.Client(project=settings.project)

    def _query(self, sql: str, **params):
        config = bigquery.QueryJobConfig(query_parameters=[bigquery.ScalarQueryParameter(k, "STRING", v) for k, v in params.items()])
        return list(self.bq.query(sql, job_config=config).result())

    def _document(self, document_id: str) -> dict:
        rows = self._query(f"SELECT * FROM `{self.settings.table_prefix}.documents` WHERE document_id=@document_id AND deleted_at IS NULL", document_id=document_id)
        if not rows:
            raise ValueError(f"document not found or deleted: {document_id}")
        return dict(rows[0])

    def _update(self, document_id: str, status: str, detail: str | None = None, findings: int | None = None) -> None:
        sql = f"UPDATE `{self.settings.table_prefix}.documents` SET status=@status, status_detail=@detail, dlp_findings_count=COALESCE(@findings, dlp_findings_count) WHERE document_id=@document_id"
        cfg = bigquery.QueryJobConfig(query_parameters=[bigquery.ScalarQueryParameter("status", "STRING", status), bigquery.ScalarQueryParameter("detail", "STRING", detail), bigquery.ScalarQueryParameter("findings", "INT64", findings), bigquery.ScalarQueryParameter("document_id", "STRING", document_id)])
        self.bq.query(sql, job_config=cfg).result()

    def _log(self, doc: dict, event: str, status: str, detail: str | None = None, chunks: int | None = None, tokens: int | None = None, cost: float | None = None) -> None:
        row = {"ingest_event_id": uuid.uuid4().hex, "document_id": doc["document_id"], "owner_id": doc["owner_id"], "project_id": doc.get("project_id"), "event": event, "status": status, "detail": detail, "chunk_count": chunks, "embedding_tokens": tokens, "cost_usd": cost, "created_at": datetime.now(timezone.utc).isoformat()}
        self.bq.insert_rows_json(f"{self.settings.table_prefix}.ingest_logs", [row])

    def _download(self, uri: str) -> bytes:
        if not uri.startswith("gs://"):
            raise ValueError("document gcs_uri must be gs://")
        bucket, name = uri[5:].split("/", 1)
        return self.storage.bucket(bucket).blob(name).download_as_bytes()

    def _check_embed_budget(self, doc: dict, estimated_cost: float) -> None:
        sql = f"""
          SELECT b.max_embed_usd_month, COALESCE(SUM(l.cost_usd), 0) spent
          FROM `{self.settings.table_prefix}.knowledge_budgets` b
          LEFT JOIN `{self.settings.table_prefix}.ingest_logs` l ON l.owner_id=b.scope_id
            AND l.event='embed' AND TIMESTAMP_TRUNC(l.created_at, MONTH)=TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), MONTH)
          WHERE b.scope_type='owner' AND b.scope_id=@owner_id
          GROUP BY b.max_embed_usd_month
        """
        rows = self._query(sql, owner_id=doc["owner_id"])
        if rows and rows[0]["max_embed_usd_month"] is not None and float(rows[0]["spent"]) + estimated_cost > float(rows[0]["max_embed_usd_month"]):
            self._update(doc["document_id"], "failed", "budget_exceeded")
            self._log(doc, "embed", "blocked", "budget_exceeded", cost=estimated_cost)
            # approval_gates was not present in the inspected target; do not invent a parallel table.
            raise RuntimeError("budget_exceeded: an approval_gates integration must be configured before override/resume")

    def process(self, document_id: str) -> None:
        doc = self._document(document_id)
        try:
            self._update(document_id, "scanning")
            data = self._download(doc["gcs_uri"])
            try:
                extracted = extract_bytes(data, doc["filename"], doc["mime_type"])
            except ExtractionError:
                if not self.settings.document_ai_processor or doc["mime_type"] != "application/pdf":
                    raise
                extracted = extract_with_document_ai(data, self.settings.document_ai_processor, self.settings.location)
            self._update(document_id, "chunking")
            chunks = chunk_blocks(document_id, extracted.blocks)
            if not chunks:
                raise ExtractionError("no chunks generated")
            dlp = DlpScanner(self.settings.project).scan([c.text for c in chunks])
            if dlp.quarantines(doc["protection_level"]):
                detail = "DLP quarantine: " + ", ".join(sorted(dlp.finding_types & {"INDIA_AADHAAR_INDIVIDUAL", "INDIA_PAN_INDIVIDUAL", "CREDIT_CARD_NUMBER"}))
                self._update(document_id, "quarantined", detail, dlp.count)
                self._log(doc, "dlp", "quarantined", detail, len(chunks))
                return
            self._update(document_id, "embedding", findings=dlp.count)
            Loader(self.bq, self.settings).merge_chunks(document_id, chunks)
            estimated_cost = sum(c.token_count for c in chunks) / 1000 * self.settings.embedding_cost_per_1k
            self._check_embed_budget(doc, estimated_cost)
            embeddings = Embedder(self.bq, self.settings).embed(chunks)
            Loader(self.bq, self.settings).merge_embeddings(doc, embeddings)
            cost = sum(e.token_count for e in embeddings) / 1000 * self.settings.embedding_cost_per_1k
            self._log(doc, "embed", "success", chunks=len(chunks), tokens=sum(e.token_count for e in embeddings), cost=cost)
            verify_document(self.bq, document_id)
        except Exception as exc:
            self._update(document_id, "failed", str(exc)[:1024])
            self._log(doc, "pipeline", "failed", str(exc)[:1024])
            raise


def pubsub_entrypoint(event: dict, _context=None) -> None:
    payload = json.loads(base64.b64decode(event["data"]).decode("utf-8")) if event.get("data") else event
    document_id = payload.get("document_id") or payload.get("message", {}).get("attributes", {}).get("document_id")
    if not document_id:
        raise ValueError("Pub/Sub message is missing document_id")
    IngestionPipeline().process(document_id)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("document_id")
    args = parser.parse_args()
    IngestionPipeline().process(args.document_id)
