"""The sole governed entry point for PRISM knowledge retrieval."""

from .search import ContextBundle, Requester, RetrievalResult, governed_search
from .context import build_agent_context

__all__ = ["ContextBundle", "Requester", "RetrievalResult", "build_agent_context", "governed_search"]
