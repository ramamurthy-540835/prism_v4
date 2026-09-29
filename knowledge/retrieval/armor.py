from __future__ import annotations

import logging

import google.auth
from google.auth.transport.requests import AuthorizedSession

from ..ingest.config import Settings

logger = logging.getLogger(__name__)


class ModelArmorBlocked(PermissionError):
    pass


class ModelArmor:
    """Optional, fail-closed screening when a template is configured."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.template = settings.model_armor_template.strip()
        if not self.template:
            logger.warning("MODEL_ARMOR_TEMPLATE is empty; Model Armor screening is disabled")

    def screen(self, text: str, label: str) -> None:
        if not self.template:
            return
        name = self.template
        if not name.startswith("projects/"):
            name = f"projects/{self.settings.project}/locations/{self.settings.location}/templates/{name}"
        url = f"https://modelarmor.{self.settings.location}.rep.googleapis.com/v1/{name}:sanitizeUserPrompt"
        credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
        session = AuthorizedSession(credentials)
        response = session.post(url, json={"userPromptData": {"text": text}}, timeout=20)
        if not response.ok:
            raise RuntimeError(f"Model Armor {label} screening failed: {response.status_code}")
        state = response.json().get("sanitizationResult", {}).get("filterMatchState", "")
        if state == "MATCH_FOUND":
            raise ModelArmorBlocked(f"Model Armor blocked {label}")
