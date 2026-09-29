from __future__ import annotations

from pathlib import Path

from google.cloud import bigquery


def verify_document(bq, document_id: str) -> None:
    sql = Path(__file__).parents[1].joinpath("sql", "003_integrity_check.sql").read_text(encoding="utf-8")
    bq.query(sql, job_config=bigquery.QueryJobConfig(query_parameters=[bigquery.ScalarQueryParameter("document_id", "STRING", document_id)])).result()
