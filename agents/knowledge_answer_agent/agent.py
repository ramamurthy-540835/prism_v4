"""ADK entry point for PRISM's governed, read-only knowledge-answer agent.

Run from the repository root so the ``knowledge`` package is importable:
    adk web agents/knowledge_answer_agent
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from google.adk.agents import Agent
from google.adk.tools import ToolContext

from knowledge.retrieval.policy import ProtectionPolicy
from knowledge.retrieval.search import Requester, governed_search

MAX_TOOL_CALLS = 6
DEFAULT_TOP_K = 8
INSTRUCTION = Path(__file__).with_name("instruction.txt").read_text(encoding="utf-8")


def _record_tool_call(tool_context: ToolContext, tool_name: str) -> dict[str, Any] | None:
    """Record a tool call in session state and enforce the instruction's call limit."""
    calls = list(tool_context.state.get("tool_calls", []))
    if len(calls) >= MAX_TOOL_CALLS:
        return {
            "status": "error",
            "message": f"Tool-call limit ({MAX_TOOL_CALLS}) reached; escalate to Knowledge Operations.",
        }
    calls.append(tool_name)
    tool_context.state["tool_calls"] = calls
    return None


def get_retrieval_policy(tool_context: ToolContext) -> dict[str, Any]:
    """Return the active PRISM agent retrieval policy. Call this FIRST for every run.

    Do not call this to search or retrieve document text; use retrieve_governed_context
    after this policy check. Returns {"status":"ok", "policy":{...}} or
    {"status":"error", "message":str} when the per-run tool limit has been reached.
    """
    limited = _record_tool_call(tool_context, "get_retrieval_policy")
    if limited:
        return limited
    policy = ProtectionPolicy(os.getenv("CRITICAL_DOCS_AGENT_ACCESS", "deny"))
    result = {
        "status": "ok",
        "policy": {
            "critical_docs_agent_access": policy.critical_docs_agent_access,
            "critical_documents_enter_prompt": not policy.denies_critical("agent"),
            "write_actions_available": False,
        },
    }
    tool_context.state["retrieval_policy"] = result["policy"]
    return result


def retrieve_governed_context(
    query: str,
    requester_id: str,
    project_id: str,
    agent_role: str,
    execution_id: str,
    tool_context: ToolContext,
    top_k: int = DEFAULT_TOP_K,
) -> dict[str, Any]:
    """Read approved PRISM knowledge for one identified requester and project.

    Call only after get_retrieval_policy and only for a specific searchable question.
    Do not call for greetings, missing identity, missing project scope, or to access a
    critical document. This calls PRISM's governed retrieval boundary, which enforces
    ACLs and excludes critical documents for agents. Returns {"status":"ok",
    "context":..., "citations":..., "evidence":...}, {"status":"empty", ...}
    when no approved context is available, or {"status":"error", "message":str}
    when authorization, validation, or retrieval fails.
    """
    limited = _record_tool_call(tool_context, "retrieve_governed_context")
    if limited:
        return limited
    if not all(value and value.strip() for value in (query, requester_id, project_id, agent_role, execution_id)):
        return {"status": "error", "message": "query, requester_id, project_id, agent_role, and execution_id are required; escalate rather than guessing."}
    if not 1 <= top_k <= 20:
        return {"status": "error", "message": "top_k must be between 1 and 20."}
    try:
        result = governed_search(
            query=query,
            requester=Requester(
                id=requester_id,
                type="agent",
                project_id=project_id,
                agent_role=agent_role,
                execution_id=execution_id,
            ),
            top_k=top_k,
            project_scope=project_id,
        )
    except Exception as exc:  # Boundary errors must be returned to the model, not retried blindly.
        return {"status": "error", "message": f"Governed retrieval failed: {exc}"}

    evidence = {
        "filtered_by_acl": result.filtered_by_acl,
        "filtered_by_protection_level": result.filtered_by_level,
        "prompt_retrieval_included": result.prompt_retrieval_included,
        "context_tokens": result.context.token_count,
    }
    tool_context.state["retrieval_evidence"] = evidence
    tool_context.state["citations"] = result.context.citations
    if not result.context.chunks:
        return {"status": "empty", "message": "No approved knowledge found for this requester and project.", "citations": [], "evidence": evidence}
    return {"status": "ok", "context": result.context.render(), "citations": result.context.citations, "evidence": evidence}


root_agent = Agent(
    name="prism_knowledge_answer_agent",
    model="gemini-2.5-flash",
    description="Answers only from PRISM's ACL-governed, non-critical knowledge context.",
    instruction=INSTRUCTION,
    tools=[get_retrieval_policy, retrieve_governed_context],
)
