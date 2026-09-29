from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ProtectionPolicy:
    """D2: critical documents are visible to users, never to agents."""

    critical_docs_agent_access: str = "deny"

    def predicate(self, requester_type: str, table_alias: str = "r") -> str:
        if requester_type == "agent" and self.critical_docs_agent_access == "deny":
            return f"{table_alias}.protection_level != 'critical'"
        return "TRUE"

    def denies_critical(self, requester_type: str) -> bool:
        return requester_type == "agent" and self.critical_docs_agent_access == "deny"
