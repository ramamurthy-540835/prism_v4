from __future__ import annotations

from google.cloud import bigquery

from ..ingest.config import Settings
from .search import ContextBundle, Requester, governed_search

_TIER_TOKENS = {"small": 3_000, "medium": 8_000, "large": 20_000}


def build_agent_context(query: str, requester: Requester, task_complexity: str = "medium", bq_client: bigquery.Client | None = None) -> ContextBundle:
    """Agent integration adapter: retrieves only when the project has ready docs.

    Callers retain their current prompt path when this returns an empty bundle.
    """
    if task_complexity not in _TIER_TOKENS:
        raise ValueError("task_complexity must be small, medium, or large")
    settings = Settings()
    bq = bq_client or bigquery.Client(project=settings.project)
    rows = bq.query(
        f"SELECT 1 FROM `{settings.table_prefix}.documents` WHERE status='ready' AND deleted_at IS NULL AND (@project_id IS NULL OR project_id=@project_id) LIMIT 1",
        job_config=bigquery.QueryJobConfig(query_parameters=[bigquery.ScalarQueryParameter("project_id", "STRING", requester.project_id)]),
    ).result()
    if next(iter(rows), None) is None:
        return ContextBundle([], [], 0)
    return governed_search(query, requester, project_scope=requester.project_id, max_context_tokens=_TIER_TOKENS[task_complexity], bq_client=bq).context
