"use client";
import { useEffect, useState } from "react";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

type Prompt = {
  promptId: string; name: string; persona?: string; taskType?: string;
  status?: string; version?: string; createdAt?: string;
  promptTypeId?: string; promptTypeName?: string; promptTypeCategory?: string;
  systemPrompt?: string;
};

type PromptType = { promptTypeId: string; name: string; category: string; template: string; description: string };

const CATEGORY_COLORS: Record<string, string> = {
  Reasoning:   "#0f62fe",
  Instruction: "#24a148",
  Retrieval:   "#0e6027",
  Agentic:     "#f1c21b",
  "Few-Shot":  "#8a3ffc",
  Emotional:   "#d12771",
};

function CategoryBadge({ category }: { category?: string }) {
  if (!category) return <span className="text-[#525252] text-xs">—</span>;
  const color = CATEGORY_COLORS[category] ?? "#525252";
  return (
    <span className="inline-block rounded px-2 py-0.5 text-xs font-medium"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
      {category}
    </span>
  );
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptTypes, setPromptTypes] = useState<PromptType[]>([]);
  const [personas, setPersonas] = useState<string[]>([]);
  const [taskTypes, setTaskTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [expandedId, setExpandedId] = useState<string>("");

  const [form, setForm] = useState({
    name: "", persona: "", taskType: "", systemPrompt: "",
    createdBy: "admin", promptTypeId: "", promptTypeCategory: "",
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/prism/prompts").then((r) => r.json()),
      fetch("/api/prism/options").then((r) => r.json()),
    ])
      .then(([p, o]) => {
        setPrompts(Array.isArray(p) ? p : []);
        setPromptTypes(o.promptTypes ?? []);
        setPersonas(o.personas ?? []);
        setTaskTypes(o.taskTypes ?? []);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const selectedPT = promptTypes.find((pt) => pt.promptTypeId === form.promptTypeId);

  const onPromptTypeChange = (promptTypeId: string) => {
    const pt = promptTypes.find((p) => p.promptTypeId === promptTypeId);
    setForm((f) => ({
      ...f,
      promptTypeId,
      promptTypeCategory: pt?.category ?? "",
    }));
  };

  const publish = async () => {
    if (!form.name || !form.systemPrompt) { setError("Name and System Prompt are required."); return; }
    setPublishing(true); setError(""); setSuccess("");
    try {
      const resp = await fetch("/api/prism/prompts/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error?.message ?? "Publish failed");
      setSuccess(`Published: ${data.promptId} (${data.version})`);
      setForm({ name: "", persona: "", taskType: "", systemPrompt: "", createdBy: "admin", promptTypeId: "", promptTypeCategory: "" });
      loadData();
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setPublishing(false);
    }
  };

  // Group prompt types by category
  const ptByCategory = promptTypes.reduce((acc, pt) => {
    if (!acc[pt.category]) acc[pt.category] = [];
    acc[pt.category].push(pt);
    return acc;
  }, {} as Record<string, PromptType[]>);

  return (
    <div className="min-h-screen bg-white text-[#161616]" style={{ fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}>
      <WorkbenchHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 bg-[#f8faff] p-6 space-y-4">
          <div className="ibm-panel p-5">
            <h1 className="text-xl font-semibold text-[#161616]">Prompt Library</h1>
            <p className="text-sm text-[#525252] mt-1">Active system prompts seeded from knowledge files. Publish new prompts to BigQuery.</p>
          </div>

          {error && <div className="rounded border border-[#da1e28] bg-white p-3 text-sm text-[#da1e28]">{error}</div>}
          {success && <div className="rounded border border-[#24a148] bg-white p-3 text-sm text-[#24a148]">{success}</div>}

          {/* Prompt table */}
          <div className="ibm-panel p-0 overflow-auto">
            <div className="p-4 border-b border-[#dcdcdc] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#161616]">Active Prompts ({prompts.length})</h2>
            </div>
            {loading ? (
              <div className="p-6 text-[#525252] text-sm">Loading prompts...</div>
            ) : prompts.length === 0 ? (
              <div className="p-6 text-[#525252] text-sm">No active prompts found. Run seed-prompts.ts to seed from knowledge files.</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dcdcdc]">
                    {["Name", "Persona", "Task Type", "Prompt Type", "Category", "Version", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#525252] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prompts.map((p) => (
                    <>
                      <tr key={p.promptId} className="border-b border-[#dcdcdc] hover:bg-[#f4f7fb]">
                        <td className="px-4 py-3 font-medium text-[#161616]">{p.name ?? "—"}</td>
                        <td className="px-4 py-3 text-[#525252]">{p.persona ?? "—"}</td>
                        <td className="px-4 py-3 text-[#525252]">{p.taskType ?? "—"}</td>
                        <td className="px-4 py-3 text-[#525252] text-xs font-mono">{(p as any).prompt_type_id ?? p.promptTypeId ?? "—"}</td>
                        <td className="px-4 py-3"><CategoryBadge category={(p as any).prompt_type_category ?? p.promptTypeCategory} /></td>
                        <td className="px-4 py-3">
                          <span className="border border-[#dcdcdc] rounded px-1.5 py-0.5 text-xs text-[#525252]">{p.version ?? "v1"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: "#24a14822", color: "#24a148" }}>
                            {p.status ?? "active"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setExpandedId(expandedId === p.promptId ? "" : p.promptId)}
                            className="text-xs text-[#0f62fe] hover:underline">
                            {expandedId === p.promptId ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {expandedId === p.promptId && (
                        <tr key={`${p.promptId}-expanded`} className="border-b border-[#dcdcdc] bg-[#f8faff]">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="text-xs font-semibold text-[#525252] mb-1">System Prompt</div>
                            <pre className="text-xs text-[#161616] whitespace-pre-wrap font-mono bg-white rounded border border-[#dcdcdc] p-3 max-h-64 overflow-auto">
                              {p.systemPrompt ?? "(no system prompt in current version — check prism_prompt_versions)"}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Publish form */}
          <div className="ibm-panel p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#161616]">Publish New Prompt</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="ibm-label block mb-1">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded border border-[#dcdcdc] bg-white px-3 py-2 text-sm"
                  placeholder="e.g. Senior Developer Code Review" />
              </div>
              <div>
                <label className="ibm-label block mb-1">Persona</label>
                <select value={form.persona} onChange={(e) => setForm({ ...form, persona: e.target.value })}
                  className="w-full rounded border border-[#dcdcdc] bg-white px-3 py-2 text-sm">
                  <option value="">Select persona</option>
                  {personas.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="ibm-label block mb-1">Task Type</label>
                <select value={form.taskType} onChange={(e) => setForm({ ...form, taskType: e.target.value })}
                  className="w-full rounded border border-[#dcdcdc] bg-white px-3 py-2 text-sm">
                  <option value="">Select task type</option>
                  {taskTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="ibm-label block mb-1">Prompt Type</label>
                <select value={form.promptTypeId} onChange={(e) => onPromptTypeChange(e.target.value)}
                  className="w-full rounded border border-[#dcdcdc] bg-white px-3 py-2 text-sm">
                  <option value="">Select prompt type</option>
                  {Object.entries(ptByCategory).map(([cat, pts]) => (
                    <optgroup key={cat} label={cat}>
                      {pts.map((pt) => (
                        <option key={pt.promptTypeId} value={pt.promptTypeId}>{pt.promptTypeId} — {pt.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {selectedPT && (
                  <p className="mt-1 text-xs text-[#525252]">{selectedPT.description}</p>
                )}
              </div>
              <div>
                <label className="ibm-label block mb-1">Created By</label>
                <input value={form.createdBy} onChange={(e) => setForm({ ...form, createdBy: e.target.value })}
                  className="w-full rounded border border-[#dcdcdc] bg-white px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="ibm-label block mb-1">System Prompt *</label>
              <textarea value={form.systemPrompt} onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                className="h-40 w-full rounded border border-[#dcdcdc] bg-white px-3 py-2 text-sm"
                placeholder={selectedPT ? `Template: ${selectedPT.template}` : "You are a senior AI assistant..."}
              />
              <div className="mt-0.5 text-xs text-[#525252]">{form.systemPrompt.length} chars · ~{Math.ceil(form.systemPrompt.length / 4)} tokens</div>
            </div>
            <button onClick={publish} disabled={publishing}
              className="ibm-btn-primary px-6 py-2 text-sm font-semibold disabled:opacity-60">
              {publishing ? "Publishing..." : "Publish Prompt"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
