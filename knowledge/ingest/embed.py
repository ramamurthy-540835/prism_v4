from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Iterable

from .chunk import Chunk
from .config import Settings


@dataclass(frozen=True)
class EmbeddedChunk:
    chunk: Chunk
    embedding: list[float]
    token_count: int


class Embedder:
    def __init__(self, bq, settings: Settings):
        self.bq, self.settings = bq, settings

    def embed(self, chunks: Iterable[Chunk]) -> list[EmbeddedChunk]:
        chunks = list(chunks)
        output: list[EmbeddedChunk] = []
        for start in range(0, len(chunks), 250):
            batch = chunks[start : start + 250]
            output.extend(self._embed_batch(batch))
        return output

    def _embed_batch(self, batch: list[Chunk]) -> list[EmbeddedChunk]:
        from google.cloud import bigquery
        rows = [{"chunk_id": c.chunk_id, "content": c.text} for c in batch]
        params = [bigquery.ArrayQueryParameter("chunks", "STRUCT<chunk_id STRING, content STRING>", rows)]
        query = f"""
          SELECT chunk_id, ml_generate_embedding_result AS embedding
          FROM ML.GENERATE_EMBEDDING(
            MODEL `{self.settings.remote_embedding_model}`,
            (SELECT chunk_id, content FROM UNNEST(@chunks))
          )
        """
        last_error = None
        for attempt in range(4):
            try:
                results = list(self.bq.query(query, job_config=bigquery.QueryJobConfig(query_parameters=params)).result())
                by_id = {str(r["chunk_id"]): [float(x) for x in r["embedding"]] for r in results}
                if set(by_id) != {c.chunk_id for c in batch}:
                    raise RuntimeError("embedding response omitted one or more chunks")
                bad = [key for key, vector in by_id.items() if len(vector) != self.settings.embedding_dim]
                if bad:
                    raise RuntimeError(f"embedding dimension mismatch for {len(bad)} chunks; expected {self.settings.embedding_dim}")
                return [EmbeddedChunk(c, by_id[c.chunk_id], c.token_count) for c in batch]
            except Exception as exc:
                last_error = exc
                if attempt == 3 or not any(code in str(exc) for code in ("429", "503", "RESOURCE_EXHAUSTED", "UNAVAILABLE")):
                    break
                time.sleep(2 ** attempt)
        # The normal path keeps text inside BigQuery. Vertex remains a bounded
        # batch fallback for remote-model outages or a model not yet provisioned.
        try:
            return self._vertex_fallback(batch)
        except Exception as vertex_error:
            raise RuntimeError(f"BigQuery embedding failed: {last_error}; Vertex fallback failed: {vertex_error}") from vertex_error

    def _vertex_fallback(self, batch: list[Chunk]) -> list[EmbeddedChunk]:
        import vertexai
        from vertexai.language_models import TextEmbeddingModel
        vertexai.init(project=self.settings.project, location=self.settings.location)
        model = TextEmbeddingModel.from_pretrained(self.settings.embedding_model)
        vectors = model.get_embeddings([chunk.text for chunk in batch], auto_truncate=True, output_dimensionality=self.settings.embedding_dim)
        result = [EmbeddedChunk(chunk, [float(v) for v in vector.values], chunk.token_count) for chunk, vector in zip(batch, vectors, strict=True)]
        if any(len(item.embedding) != self.settings.embedding_dim for item in result):
            raise RuntimeError(f"Vertex embedding dimension mismatch; expected {self.settings.embedding_dim}")
        return result
