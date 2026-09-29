from __future__ import annotations

from dataclasses import dataclass

from google.cloud import bigquery


@dataclass(frozen=True)
class Scope:
    predicate: str
    parameters: list[bigquery.ScalarQueryParameter]


def resolve_scope(requester, table_alias: str = "r") -> Scope:
    """Return a pre-VECTOR_SEARCH predicate using the verified PRISM membership model."""
    acl = f"""
      EXISTS (
        SELECT 1 FROM `aidirac-503309.prism_prompt_catalog.document_acl` a
        WHERE a.document_id = {table_alias}.document_id
          AND a.permission IN ('read', 'retrieve', 'admin')
          AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP())
          AND ((a.grantee_type = 'user' AND a.grantee_id = @requester_id)
            OR (a.grantee_type = 'agent_role' AND a.grantee_id = @agent_role))
      )
    """
    project_membership = "FALSE"
    if requester.type == "user":
        project_membership = f"""
          ({table_alias}.visibility IN ('project', 'org')
           AND EXISTS (
             SELECT 1
             FROM `aidirac-503309.prism.projects` p
             JOIN `aidirac-503309.prism.organization_members` m ON m.org_id = p.org_id
             WHERE p.id = {table_alias}.project_id AND m.user_id = @requester_id
           ))
        """
    return Scope(
        predicate=f"({table_alias}.owner_id = @requester_id OR {project_membership} OR {acl})",
        parameters=[
            bigquery.ScalarQueryParameter("requester_id", "STRING", requester.id),
            bigquery.ScalarQueryParameter("agent_role", "STRING", requester.agent_role or ""),
        ],
    )
