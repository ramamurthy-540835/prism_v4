# PRISM Knowledge Answer Agent — Day 2 canvas

| Canvas box | Decision |
| --- | --- |
| **Goal** | Answer an identified user's project-scoped knowledge question only from approved, governed retrieval context; done means an evidenced answer, an explicit no-results response, or escalation. |
| **Passes the test?** | Yes: it has a concrete goal, reads the live PRISM knowledge system, and chooses whether a retrieval is needed from the question and retrieval result. |
| **Actions** | No business-system writes. The governed retrieval boundary emits required audit telemetry; that audit write is not agent-controllable. |
| **Tools** | `get_retrieval_policy` (read, first); `retrieve_governed_context` (read, after policy). No write tools are exposed. |
| **Model** | Gemini 2.5 Flash on Vertex AI; Flash tier, default thinking budget. Pinned to the GA model ID `gemini-2.5-flash`. |
| **Memory** | Session keys: `tool_calls`, `retrieval_policy`, `retrieval_evidence`, `citations`. Long-term facts: none. Never in prompt: critical documents, credentials, raw ACL records, secrets, and unapproved documents. |
| **Orchestration** | One agent. The work is a content-dependent choice between answer, no result, and escalation; a fixed multi-agent pipeline adds no value. |
| **Guardrails & stop** | Six tools or three minutes maximum; never accesses critical documents; no write tools; escalation owner is Knowledge Operations. Missing identity/project scope, policy error, or material ambiguity escalates. |

## Service-account scope

Use a dedicated `prism-knowledge-answer-agent` service account. Grant only the runtime permissions necessary to execute the existing governed retrieval boundary (for example, the dataset-level read permissions it requires and the narrowly scoped audit-log append permission). It must not receive Storage object read, document-write, ACL-admin, budget-admin, prompt-admin, or broad project-owner permissions.
