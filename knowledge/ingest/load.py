from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone

from .chunk import Chunk
from .config import Settings
from .embed import EmbeddedChunk


class Loader:
    def __init__(self, bq, settings: Settings):
        self.bq, self.settings = bq, settings

    def _stage_and_merge(self, name: str, rows: list[dict], target: str, merge_sql: str) -> None:
        if not rows:
            return
        stage = f"{self.settings.table_prefix}._{name}_{uuid.uuid4().hex}"
        try:
            self.bq.load_table_from_json(rows, stage).result()
            self.bq.query(merge_sql.format(stage=stage, target=target)).result()
        finally:
            self.bq.delete_table(stage, not_found_ok=True)

    def merge_chunks(self, document_id: str, chunks: list[Chunk]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        rows = [{"chunk_id": c.chunk_id, "document_id": document_id, "chunk_index": c.chunk_index, "page_start": c.page_start, "page_end": c.page_end, "section_path": c.section_path or None, "chunk_text": c.text, "chunk_sha256": c.chunk_sha256, "token_count": c.token_count, "created_at": now} for c in chunks]
        self._stage_and_merge("stage_doc_chunks", rows, f"{self.settings.table_prefix}.document_chunks", """
          MERGE `{target}` T USING `{stage}` S ON T.chunk_id = S.chunk_id
          WHEN NOT MATCHED THEN INSERT (chunk_id,document_id,chunk_index,page_start,page_end,section_path,chunk_text,chunk_sha256,token_count,created_at)
          VALUES (S.chunk_id,S.document_id,S.chunk_index,S.page_start,S.page_end,S.section_path,S.chunk_text,S.chunk_sha256,S.token_count,S.created_at)
        """)

    def merge_embeddings(self, doc: dict, embeddings: list[EmbeddedChunk]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        rows = []
        for item in embeddings:
            retrieval_id = hashlib.sha256(f"{item.chunk.chunk_id}|{self.settings.embedding_model}".encode()).hexdigest()[:32]
            rows.append({"retrieval_id": retrieval_id, "chunk_id": item.chunk.chunk_id, "document_id": doc["document_id"], "owner_id": doc["owner_id"], "project_id": doc.get("project_id"), "protection_level": doc["protection_level"], "visibility": doc["visibility"], "embedding": item.embedding, "embedding_model": self.settings.embedding_model, "embedded_at": now})
        self._stage_and_merge("stage_doc_retrieval", rows, f"{self.settings.table_prefix}.document_retrieval", """
          MERGE `{target}` T USING `{stage}` S ON T.retrieval_id = S.retrieval_id
          WHEN MATCHED THEN UPDATE SET embedding=S.embedding, embedded_at=S.embedded_at, protection_level=S.protection_level, visibility=S.visibility, project_id=S.project_id
          WHEN NOT MATCHED THEN INSERT (retrieval_id,chunk_id,document_id,owner_id,project_id,protection_level,visibility,embedding,embedding_model,embedded_at)
          VALUES (S.retrieval_id,S.chunk_id,S.document_id,S.owner_id,S.project_id,S.protection_level,S.visibility,S.embedding,S.embedding_model,S.embedded_at)
        """)
