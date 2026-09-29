-- PRISM Knowledge Layer: foundational schema.
-- D1 applied: gemini-embedding-001 with full 3072-dimensional embeddings.
-- Derived retrieval rows use deterministic IDs and may be rebuilt at any time.

CREATE SCHEMA IF NOT EXISTS `aidirac-503309.prism_prompt_catalog`
OPTIONS(location = 'US');

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism_prompt_catalog.documents` (
  document_id        STRING NOT NULL,
  owner_id           STRING NOT NULL,
  project_id         STRING,
  title              STRING,
  filename           STRING NOT NULL,
  mime_type          STRING NOT NULL,
  size_bytes         INT64,
  content_sha256     STRING NOT NULL,
  gcs_uri            STRING NOT NULL,
  page_count         INT64,
  protection_level   STRING NOT NULL,
  visibility         STRING NOT NULL,
  status             STRING NOT NULL,
  status_detail      STRING,
  dlp_findings_count INT64 DEFAULT 0,
  tags               ARRAY<STRING>,
  created_at         TIMESTAMP NOT NULL,
  ready_at           TIMESTAMP,
  deleted_at         TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY owner_id, project_id, status;

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism_prompt_catalog.document_chunks` (
  chunk_id        STRING NOT NULL,
  document_id     STRING NOT NULL,
  chunk_index     INT64 NOT NULL,
  page_start      INT64,
  page_end        INT64,
  section_path    STRING,
  chunk_text      STRING NOT NULL,
  chunk_sha256    STRING NOT NULL,
  token_count     INT64,
  created_at      TIMESTAMP NOT NULL
)
CLUSTER BY document_id;

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism_prompt_catalog.document_retrieval` (
  retrieval_id     STRING NOT NULL,
  chunk_id         STRING NOT NULL,
  document_id      STRING NOT NULL,
  owner_id         STRING NOT NULL,
  project_id       STRING,
  protection_level STRING NOT NULL,
  visibility       STRING NOT NULL,
  -- BigQuery does not allow NOT NULL on ARRAY columns; ingestion validates a
  -- non-empty, exactly 3072-dimensional embedding before each MERGE.
  embedding        ARRAY<FLOAT64>,
  embedding_model  STRING NOT NULL,
  embedded_at      TIMESTAMP NOT NULL
)
CLUSTER BY owner_id, project_id, protection_level;

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism_prompt_catalog.document_acl` (
  document_id  STRING NOT NULL,
  grantee_type STRING NOT NULL,
  grantee_id   STRING NOT NULL,
  permission   STRING NOT NULL,
  granted_by   STRING NOT NULL,
  granted_at   TIMESTAMP NOT NULL,
  expires_at   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism_prompt_catalog.retrieval_logs` (
  retrieval_event_id STRING NOT NULL,
  execution_id       STRING,
  requester_id       STRING NOT NULL,
  requester_type     STRING NOT NULL,
  query_sha256       STRING NOT NULL,
  query_text         STRING,
  project_id         STRING,
  top_k              INT64,
  chunk_ids_returned ARRAY<STRING>,
  document_ids_hit   ARRAY<STRING>,
  filtered_by_acl    INT64,
  filtered_by_level  INT64,
  latency_ms         INT64,
  embedding_tokens   INT64,
  cost_usd           NUMERIC,
  created_at         TIMESTAMP NOT NULL
)
PARTITION BY DATE(created_at);

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism_prompt_catalog.knowledge_budgets` (
  scope_type            STRING NOT NULL,
  scope_id              STRING NOT NULL,
  max_documents         INT64,
  max_storage_bytes     INT64,
  max_embed_usd_month   NUMERIC,
  max_retrievals_day    INT64,
  updated_at            TIMESTAMP NOT NULL
);

-- Pipeline audit events. This is intentionally separate from retrieval_logs.
CREATE TABLE IF NOT EXISTS `aidirac-503309.prism_prompt_catalog.ingest_logs` (
  ingest_event_id STRING NOT NULL,
  document_id      STRING NOT NULL,
  owner_id         STRING NOT NULL,
  project_id       STRING,
  event            STRING NOT NULL,
  status           STRING NOT NULL,
  detail           STRING,
  chunk_count      INT64,
  embedding_tokens INT64,
  cost_usd         NUMERIC,
  created_at       TIMESTAMP NOT NULL
)
PARTITION BY DATE(created_at)
CLUSTER BY document_id, owner_id, event;

-- BigQuery requires at least one non-null vector before it can build this IVF
-- index. The ingestion pipeline reruns this idempotent statement after its
-- first valid embedding MERGE.
CREATE VECTOR INDEX IF NOT EXISTS document_retrieval_idx
ON `aidirac-503309.prism_prompt_catalog.document_retrieval`(embedding)
OPTIONS(index_type = 'IVF', distance_type = 'COSINE');
