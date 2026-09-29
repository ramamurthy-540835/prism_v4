-- Phase 4 controls. ADD COLUMN is idempotent for the Phase 1 table already live.
ALTER TABLE `aidirac-503309.prism_prompt_catalog.documents`
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS `aidirac-503309.prism_prompt_catalog.safety_violations` (
  violation_id   STRING NOT NULL,
  execution_id   STRING,
  requester_id   STRING NOT NULL,
  requester_type STRING NOT NULL,
  document_id    STRING,
  violation_type STRING NOT NULL,
  detail         STRING,
  query_sha256   STRING,
  created_at     TIMESTAMP NOT NULL
)
PARTITION BY DATE(created_at)
CLUSTER BY requester_id, violation_type;
