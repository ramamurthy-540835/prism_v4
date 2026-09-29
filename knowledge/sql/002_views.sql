-- UI and integrity checks use this single document-status source of truth.
CREATE OR REPLACE VIEW `aidirac-503309.prism_prompt_catalog.v_document_status` AS
SELECT
  d.document_id,
  d.owner_id,
  d.project_id,
  d.title,
  d.filename,
  d.mime_type,
  d.size_bytes,
  d.content_sha256,
  d.gcs_uri,
  d.page_count,
  d.protection_level,
  d.visibility,
  d.status,
  d.status_detail,
  d.dlp_findings_count,
  d.tags,
  d.created_at,
  d.ready_at,
  d.deleted_at,
  (SELECT COUNT(*)
   FROM `aidirac-503309.prism_prompt_catalog.document_chunks` c
   WHERE c.document_id = d.document_id) AS chunk_count,
  (SELECT COUNT(*)
   FROM `aidirac-503309.prism_prompt_catalog.document_retrieval` r
   WHERE r.document_id = d.document_id) AS embedded_count
FROM `aidirac-503309.prism_prompt_catalog.documents` d;
