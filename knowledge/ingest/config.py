from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    project: str = os.getenv("GCP_PROJECT", "aidirac-503309")
    dataset: str = os.getenv("BQ_DATASET", "prism_prompt_catalog")
    bucket: str = os.getenv("KNOWLEDGE_BUCKET", "aidirac-503309-prism-knowledge")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "embedding_model")
    embedding_dim: int = int(os.getenv("EMBEDDING_DIM", "3072"))
    location: str = os.getenv("GCP_REGION", "us-central1")
    embedding_cost_per_1k: float = float(os.getenv("EMBEDDING_COST_PER_1K_USD", "0"))
    document_ai_processor: str = os.getenv("DOCUMENT_AI_PROCESSOR", "")
    model_armor_template: str = os.getenv("MODEL_ARMOR_TEMPLATE", "")

    @property
    def table_prefix(self) -> str:
        return f"{self.project}.{self.dataset}"

    @property
    def remote_embedding_model(self) -> str:
        return self.embedding_model if self.embedding_model.count(".") >= 2 else f"{self.table_prefix}.{self.embedding_model}"
