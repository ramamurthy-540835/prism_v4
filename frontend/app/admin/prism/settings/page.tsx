"use client";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

const ENV_VARS = [
  { name: "OPENAI_API_KEY", description: "API key for OpenAI provider (GPT-4o, GPT-4o-mini)" },
  { name: "ANTHROPIC_API_KEY", description: "API key for Anthropic provider (Claude Sonnet, Opus, Haiku)" },
  { name: "GOOGLE_GEMINI_API_KEY", description: "API key for Google Gemini direct API" },
  { name: "GOOGLE_APPLICATION_CREDENTIALS", description: "Path to GCP service account JSON for Vertex AI and BigQuery" },
  { name: "GOOGLE_CLOUD_PROJECT", description: "GCP project ID (ctoteam)" },
  { name: "VERTEX_AI_LOCATION", description: "Vertex AI region (e.g. us-central1)" },
  { name: "BQ_DATASET", description: "BigQuery dataset name (prism)" },
  { name: "BQ_USAGE_TABLE", description: "Usage audit log table (prism_usage)" },
  { name: "BQ_PLANS_TABLE", description: "Plan catalog table (prism_plans)" },
  { name: "BQ_BUDGETS_TABLE", description: "OSSA budget policy table (prism_budgets)" },
  { name: "BQ_ROUTING_TABLE", description: "Model routing rules table (prism_model_routing)" },
  { name: "BIGQUERY_PROJECT_ID", description: "Alias for GOOGLE_CLOUD_PROJECT (ctoteam)" },
  { name: "BIGQUERY_DATASET", description: "Alias for BQ_DATASET (prism)" },
];

const BQ_TABLES = [
  { table: "ctoteam.prism.prism_usage", description: "Every AI call audit log — tokens, cost, decision, latency" },
  { table: "ctoteam.prism.prism_plans", description: "Plan catalog with pricing, token/spend limits, status" },
  { table: "ctoteam.prism.prism_subscriptions", description: "User and org subscription / plan assignments" },
  { table: "ctoteam.prism.prism_budgets", description: "OSSA budget policies — token/spend thresholds, hard-stop flags" },
  { table: "ctoteam.prism.prism_model_routing", description: "Dynamic provider/model routing rules, fallback logic, cost constraints" },
  { table: "ctoteam.prism.prism_prompts", description: "Prompt registry — identity, task type, status (draft/active)" },
  { table: "ctoteam.prism.prism_prompt_versions", description: "Versioned system prompt content — promptId + version + systemPrompt" },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-white text-[#161616]" style={{ fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}>
      <WorkbenchHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 bg-[#f8faff] p-6 space-y-4">
          <div className="ibm-panel p-5">
            <h1 className="text-xl font-semibold text-[#161616]">Settings</h1>
            <p className="text-sm text-[#525252] mt-1">Environment variable reference and BigQuery table schema overview. Values are never displayed.</p>
          </div>

          <div className="ibm-panel p-0 overflow-auto">
            <div className="p-4 border-b border-[#dcdcdc]">
              <h2 className="text-sm font-semibold text-[#161616]">Environment Variables (.env.local)</h2>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#dcdcdc]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#525252]">Variable</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#525252]">Description</th>
                </tr>
              </thead>
              <tbody>
                {ENV_VARS.map((v) => (
                  <tr key={v.name} className="border-b border-[#dcdcdc] hover:bg-[#f4f7fb]">
                    <td className="px-4 py-3 font-mono text-[#0f62fe] font-medium">{v.name}</td>
                    <td className="px-4 py-3 text-[#525252]">{v.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ibm-panel p-0 overflow-auto">
            <div className="p-4 border-b border-[#dcdcdc]">
              <h2 className="text-sm font-semibold text-[#161616]">BigQuery Tables</h2>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#dcdcdc]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#525252]">Table</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#525252]">Description</th>
                </tr>
              </thead>
              <tbody>
                {BQ_TABLES.map((t) => (
                  <tr key={t.table} className="border-b border-[#dcdcdc] hover:bg-[#f4f7fb]">
                    <td className="px-4 py-3 font-mono text-[#0f62fe] font-medium text-xs">{t.table}</td>
                    <td className="px-4 py-3 text-[#525252]">{t.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ibm-panel p-5">
            <h2 className="text-sm font-semibold text-[#161616] mb-2">PRISM Design Rules</h2>
            <ul className="space-y-1 text-sm text-[#525252]">
              <li>• Zero hardcoding — all models, plans, personas, prompts, routing rules come from BigQuery at runtime.</li>
              <li>• Every AI call is logged to <code>prism_usage</code> with full OSSA decision, tokens, cost, and latency.</li>
              <li>• OSSA budget guard runs before every model call — stop at &gt;95%, warn at &gt;70%.</li>
              <li>• Model routing is resolved from <code>prism_model_routing</code> per planId + taskType.</li>
              <li>• Prompt versions are stored in <code>prism_prompt_versions</code> and loaded at runtime.</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
