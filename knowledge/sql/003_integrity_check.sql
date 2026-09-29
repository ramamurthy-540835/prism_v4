-- Last statement of ingestion. Bind @document_id as STRING.
-- A document becomes ready only when both deterministic derived row counts agree.
UPDATE `aidirac-503309.prism_prompt_catalog.documents` AS d
SET
  status = IF(s.chunk_count > 0 AND s.chunk_count = s.embedded_count, 'ready', 'failed'),
  status_detail = IF(s.chunk_count > 0 AND s.chunk_count = s.embedded_count,
                     NULL,
                     'chunk/embedding count mismatch'),
  ready_at = IF(s.chunk_count > 0 AND s.chunk_count = s.embedded_count,
                CURRENT_TIMESTAMP(),
                NULL)
FROM `aidirac-503309.prism_prompt_catalog.v_document_status` AS s
WHERE d.document_id = s.document_id
  AND d.document_id = @document_id;

-- Nightly guard. Run as a separate scheduled statement; it never promotes a doc.
UPDATE `aidirac-503309.prism_prompt_catalog.documents` AS d
SET
  status = 'failed',
  status_detail = 'chunk/embedding count mismatch',
  ready_at = NULL
FROM `aidirac-503309.prism_prompt_catalog.v_document_status` AS s
WHERE d.document_id = s.document_id
  AND d.status = 'ready'
  AND (s.chunk_count = 0 OR s.chunk_count != s.embedded_count);
