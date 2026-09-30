# PRISM Knowledge Answer Agent

This is the Day 2 ADK deliverable for the PRISM knowledge layer. It is deliberately read-only: the agent can retrieve only through `knowledge.retrieval.governed_search`, which applies ACL filtering and excludes critical documents from agent context.

## Run locally

From the repository root, create an environment with Python 3.10+ and install the requirements:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r agents\knowledge_answer_agent\requirements.txt
Copy-Item agents\knowledge_answer_agent\.env.example .env
gcloud auth application-default login
adk web agents/knowledge_answer_agent
```

Use a real, authorized requester ID, project ID, agent role, and unique execution ID in each question. The supplied `evalset.json` defines the minimum three Day 6 trajectories; replace its placeholder IDs with real test principals before running it.

`gemini-2.5-flash` is pinned as the Flash-tier, GA Vertex AI model. Verify availability in the target region before deployment; model availability can differ by region and organization policy.
