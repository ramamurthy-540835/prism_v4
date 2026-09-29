from __future__ import annotations

import hashlib
import os
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal

from google.cloud import bigquery

from ..ingest.chunk import Chunk
from ..ingest.config import Settings
from ..ingest.embed import Embedder
from .acl import resolve_scope
from .armor import ModelArmor, ModelArmorBlocked
from .policy import ProtectionPolicy


@dataclass(frozen=True)
class Requester:
    id: str
    type: Literal["user", "agent"]
    project_id: str | None = None
    agent_role: str | None = None
    execution_id: str | None = None


@dataclass(frozen=True)
class RetrievedChunk:
    source: Literal["document"]
    chunk_id: str
    document_id: str
    title: str
    source_uri: str
    page_start: int | None
    page_end: int | None
    section_path: str | None
    text: str
    similarity: float
    score: float
    protection_level: str


@dataclass(frozen=True)
class ContextBundle:
    chunks: list[RetrievedChunk]
    citations: list[str]
    token_count: int

    def render(self) -> str:
        return "\n\n".join(f"[{i}] {chunk.text}" for i, chunk in enumerate(self.chunks, start=1))


@dataclass(frozen=True)
class RetrievalResult:
    context: ContextBundle
    filtered_by_acl: int
    filtered_by_level: int
    prompt_retrieval_included: bool


def _token_count(text: str) -> int:
    return max(1, len(text.split()))


def _section_weight(path: str | None) -> float:
    value = (path or "").lower()
    if "references" in value:
        return 0.6
    if "abstract" in value or "summary" in value:
        return 1.1
    return 1.0


def _embed_query(bq: bigquery.Client, settings: Settings, query: str) -> list[float]:
    query_chunk = Chunk("__query__", 0, 0, 0, "", query, hashlib.sha256(query.encode()).hexdigest(), _token_count(query))
    return Embedder(bq, settings).embed([query_chunk])[0].embedding


def _has_table(bq: bigquery.Client, settings: Settings, table_name: str) -> bool:
    sql = f"SELECT 1 FROM `{settings.project}.{settings.dataset}.INFORMATION_SCHEMA.TABLES` WHERE table_name=@table_name LIMIT 1"
    rows = bq.query(sql, job_config=bigquery.QueryJobConfig(query_parameters=[bigquery.ScalarQueryParameter("table_name", "STRING", table_name)])).result()
    return next(iter(rows), None) is not None


def _counts(bq: bigquery.Client, settings: Settings, scope, policy_predicate: str) -> tuple[int, int, bool]:
    sql = f"""
      SELECT
        COUNT(*) AS all_candidates,
        COUNTIF({scope.predicate}) AS acl_candidates,
        COUNTIF({scope.predicate} AND {policy_predicate}) AS allowed_candidates,
        COUNTIF({scope.predicate} AND r.protection_level='critical') > 0 AS critical_in_scope
      FROM `{settings.table_prefix}.document_retrieval` r
    """
    row = next(iter(bq.query(sql, job_config=bigquery.QueryJobConfig(query_parameters=scope.parameters)).result()), None)
    if row is None:
        return 0, 0, False
    return int(row["all_candidates"] - row["acl_candidates"]), int(row["acl_candidates"] - row["allowed_candidates"]), bool(row["critical_in_scope"])


def _audit(bq: bigquery.Client, settings: Settings, requester: Requester, query: str, rows: list[RetrievedChunk], acl_count: int, level_count: int, top_k: int, elapsed_ms: int, critical_in_scope: bool) -> None:
    errors = bq.insert_rows_json(f"{settings.table_prefix}.retrieval_logs", [{
        "retrieval_event_id": uuid.uuid4().hex,
        "execution_id": requester.execution_id,
        "requester_id": requester.id,
        "requester_type": requester.type,
        "query_sha256": hashlib.sha256(query.encode()).hexdigest(),
        "query_text": None if critical_in_scope else query,
        "project_id": requester.project_id,
        "top_k": top_k,
        "chunk_ids_returned": [row.chunk_id for row in rows],
        "document_ids_hit": sorted({row.document_id for row in rows}),
        "filtered_by_acl": acl_count,
        "filtered_by_level": level_count,
        "latency_ms": elapsed_ms,
        "embedding_tokens": _token_count(query),
        "cost_usd": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }])
    if errors:
        raise RuntimeError(f"retrieval audit write failed: {errors}")


def _safety_violation(bq: bigquery.Client, settings: Settings, requester: Requester, violation_type: str, query: str, detail: str) -> None:
    errors = bq.insert_rows_json(f"{settings.table_prefix}.safety_violations", [{
        "violation_id": uuid.uuid4().hex, "execution_id": requester.execution_id,
        "requester_id": requester.id, "requester_type": requester.type,
        "document_id": None, "violation_type": violation_type, "detail": detail,
        "query_sha256": hashlib.sha256(query.encode()).hexdigest(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }])
    if errors:
        raise RuntimeError(f"safety-violation audit write failed: {errors}")


def governed_search(query: str, requester: Requester, top_k: int = 8, project_scope: str | None = None, include_prompts: bool = True, min_similarity: float = 0.70, max_context_tokens: int = 8000, bq_client: bigquery.Client | None = None) -> RetrievalResult:
    """The only supported knowledge search boundary; all filtering is pre-vector."""
    if not query.strip():
        raise ValueError("query cannot be empty")
    if requester.type not in {"user", "agent"}:
        raise ValueError("requester.type must be 'user' or 'agent'")
    if not 1 <= top_k <= 100:
        raise ValueError("top_k must be between 1 and 100")
    if not 0 <= min_similarity <= 1:
        raise ValueError("min_similarity must be between 0 and 1")
    started = time.monotonic()
    settings = Settings()
    bq = bq_client or bigquery.Client(project=settings.project)
    scope = resolve_scope(requester)
    policy = ProtectionPolicy(os.getenv("CRITICAL_DOCS_AGENT_ACCESS", "deny"))
    protection = policy.predicate(requester.type)
    acl_count, level_count, critical_in_scope = _counts(bq, settings, scope, protection)
    if critical_in_scope and policy.denies_critical(requester.type):
        _safety_violation(bq, settings, requester, "critical_document_agent_access_denied", query, "Agent request had critical documents in accessible scope")
    armor = ModelArmor(settings)
    try:
        armor.screen(query, "query")
    except ModelArmorBlocked:
        _safety_violation(bq, settings, requester, "model_armor_query_blocked", query, "Model Armor matched the query")
        _audit(bq, settings, requester, query, [], acl_count, level_count, top_k, int((time.monotonic() - started) * 1000), critical_in_scope)
        raise
    embedding = _embed_query(bq, settings, query)
    parameters = scope.parameters + [
        bigquery.ArrayQueryParameter("query_embedding", "FLOAT64", embedding),
        bigquery.ScalarQueryParameter("min_distance", "FLOAT64", 1 - min_similarity),
    ]
    project_filter = "" if not project_scope else "AND r.project_id = @project_scope"
    if project_scope:
        parameters.append(bigquery.ScalarQueryParameter("project_scope", "STRING", project_scope))
    sql = f"""
      SELECT base.chunk_id, base.document_id, base.protection_level, distance,
             c.chunk_text, c.page_start, c.page_end, c.section_path, d.title, d.gcs_uri
      FROM VECTOR_SEARCH(
        (SELECT * FROM `{settings.table_prefix}.document_retrieval` r
         WHERE {scope.predicate} AND {protection} {project_filter}),
        'embedding', (SELECT @query_embedding AS embedding),
        top_k => {int(top_k)}, distance_type => 'COSINE'
      )
      JOIN `{settings.table_prefix}.document_chunks` c USING (chunk_id)
      JOIN `{settings.table_prefix}.documents` d USING (document_id)
      WHERE d.status='ready' AND d.deleted_at IS NULL AND distance <= @min_distance
    """
    retrieved = []
    for row in bq.query(sql, job_config=bigquery.QueryJobConfig(query_parameters=parameters)).result():
        similarity = 1 - float(row["distance"])
        retrieved.append(RetrievedChunk("document", row["chunk_id"], row["document_id"], row["title"] or "Untitled document", row["gcs_uri"], row["page_start"], row["page_end"], row["section_path"], row["chunk_text"], similarity, similarity * _section_weight(row["section_path"]), row["protection_level"]))
    retrieved.sort(key=lambda row: row.score, reverse=True)
    selected: list[RetrievedChunk] = []
    tokens = 0
    for row in retrieved:
        row_tokens = _token_count(row.text)
        if tokens + row_tokens <= max_context_tokens:
            selected.append(row)
            tokens += row_tokens
    try:
        armor.screen(ContextBundle(selected, [], tokens).render(), "assembled context")
    except ModelArmorBlocked:
        _safety_violation(bq, settings, requester, "model_armor_context_blocked", query, "Model Armor matched assembled retrieval context")
        _audit(bq, settings, requester, query, [], acl_count, level_count, top_k, int((time.monotonic() - started) * 1000), critical_in_scope)
        raise
    citations = [f"[{index}] {row.title}, p.{row.page_start or '?'}, {row.section_path or 'Document'}" for index, row in enumerate(selected, start=1)]
    prompt_available = include_prompts and _has_table(bq, settings, "prompt_retrieval")
    # No prompt_retrieval table existed in Phase 0, so no schema is guessed here.
    _audit(bq, settings, requester, query, selected, acl_count, level_count, top_k, int((time.monotonic() - started) * 1000), critical_in_scope)
    return RetrievalResult(ContextBundle(selected, citations, tokens), acl_count, level_count, prompt_available)
