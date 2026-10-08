"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";
import AppSidebar from "@/components/workbench/AppSidebar";
import { WORKBENCH_EXAMPLES } from "@/lib/workbenchExamples";
import { resolveTemplate } from "@/lib/resolveTemplate";
import { PERSONAS, PERSONA_NAMES, DEFAULT_PERSONA, isPersona, taskTokenDefault } from "@/config/personas";
import promptCatalog from "../../../../../knowledge/prompt_types/Prompts_Types.json";
import {
  Code2, Network, TestTube2, ClipboardCheck,
  FileText, Bot, GraduationCap, BookOpen,
  Play, Copy, Check
} from "lucide-react";

type OptionModel = { modelId: string; provider: string; taskType: string };
type OptionPromptType = {
  promptTypeId: string;
  name: string;
  category: string;
  template: string;
  inputVars: string[];
  description: string;
};
type Options = {
  models: OptionModel[];
  taskTypes: string[];
  personas: string[];
  promptTypes: OptionPromptType[];
};

const FALLBACK_PROMPT_TYPES = Object.entries(promptCatalog).map(([name, value], index) => ({
  promptTypeId: `PT${String(index + 1).padStart(3, "0")}`,
  name, category: "General", template: value.template, inputVars: value.input_vars, description: name,
}));

const EMPTY_OPTIONS: Options = {
  models: [],
  taskTypes: PERSONA_NAMES.flatMap((name) => [...PERSONAS[name].tasks]),
  personas: PERSONA_NAMES,
  promptTypes: FALLBACK_PROMPT_TYPES
};

const iconMap: Record<string, any> = {
  Code2, Network, TestTube2, ClipboardCheck, FileText, Bot, GraduationCap, BookOpen
};

const providerColor: Record<string, string> = {
  anthropic: "#ff832b",
  google: "#24a148",
  vertex: "#24a148",
  openai: "#0f62fe"
};

export default function WorkbenchPage() {
  const leftRef = useRef<HTMLDivElement>(null);

  const [options, setOptions] = useState<Options>(EMPTY_OPTIONS);
  const [optionsError, setOptionsError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [quickOpen, setQuickOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    userId: "",
    orgId: "naturelabs",
    role: "developer",
    persona: DEFAULT_PERSONA as string,
    planId: "starter",
    taskType: PERSONAS[DEFAULT_PERSONA].tasks[0] as string,
    promptTypeId: PERSONAS[DEFAULT_PERSONA].primaryPromptType as string,
    systemPrompt: "",
    userMessage: "",
    maxTokens: taskTokenDefault(PERSONAS[DEFAULT_PERSONA].tasks[0]),
    requestedModelId: ""
  });

  useEffect(() => {
    const personaFromUrl = new URLSearchParams(window.location.search).get("persona")?.trim();

    // Set initial form with defaults immediately
    const remembered = window.localStorage.getItem("prism:last-persona") ?? "";
    const selectedPersona = personaFromUrl && isPersona(personaFromUrl)
      ? personaFromUrl : isPersona(remembered) ? remembered : DEFAULT_PERSONA;
    setForm((f) => ({
      ...f,
      persona: selectedPersona,
      taskType: PERSONAS[selectedPersona].tasks[0],
      promptTypeId: PERSONAS[selectedPersona].primaryPromptType,
      maxTokens: taskTokenDefault(PERSONAS[selectedPersona].tasks[0])
    }));

    fetch("/api/prism/options")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json?.error?.message ?? "Failed to load options");
        return json;
      })
      .then((data: Partial<Options>) => {
        const normalized: Options = {
          models: Array.isArray(data?.models) && data.models.length ? data.models : EMPTY_OPTIONS.models,
          taskTypes: Array.isArray(data?.taskTypes) && data.taskTypes.length ? data.taskTypes : EMPTY_OPTIONS.taskTypes,
          personas: Array.isArray(data?.personas) && data.personas.length ? data.personas : EMPTY_OPTIONS.personas,
          promptTypes: Array.isArray(data?.promptTypes) && data.promptTypes.length ? data.promptTypes : EMPTY_OPTIONS.promptTypes
        };
        setOptions(normalized);
        setOptionsError("");
      })
      .catch((e) => {
        setOptionsError(e instanceof Error ? e.message : "Failed to load options");
      });
  }, []);

  const personaConfig = PERSONAS[isPersona(form.persona) ? form.persona : DEFAULT_PERSONA];
  const personaPromptTypes = options.promptTypes.filter((pt) => (personaConfig.promptTypes as readonly string[]).includes(pt.promptTypeId));
  const selectPersona = (persona: string) => {
    if (!isPersona(persona)) return;
    window.localStorage.setItem("prism:last-persona", persona);
    const taskType = PERSONAS[persona].tasks[0];
    setForm((f) => ({ ...f, persona, taskType, promptTypeId: PERSONAS[persona].primaryPromptType,
      requestedModelId: "", maxTokens: taskTokenDefault(taskType), systemPrompt: "" }));
  };

  const selectedPromptType = useMemo(
    () => options.promptTypes.find((pt) => pt.promptTypeId === form.promptTypeId),
    [options.promptTypes, form.promptTypeId]
  );

  const filteredModels = useMemo(
    () => options.models.filter((m) => !form.taskType || m.taskType === form.taskType),
    [options.models, form.taskType]
  );

  const estTokens = useMemo(
    () => Math.max(1, Math.ceil(`${form.systemPrompt}\n${form.userMessage}`.length / 4)),
    [form.systemPrompt, form.userMessage]
  );

  const applyExample = (ex: any) => {
    const pt = options.promptTypes.find((p) => p.promptTypeId === ex.promptTypeId);
    const resolved = pt ? resolveTemplate(pt.template, {
      persona: ex.persona,
      taskType: ex.taskType,
      promptTypeName: pt.name,
      promptTypeCategory: pt.category
    }) : "";
    setForm((f) => ({
      ...f,
      persona: ex.persona,
      taskType: ex.taskType,
      promptTypeId: ex.promptTypeId,
      userMessage: ex.userMessage,
      maxTokens: ex.maxTokens,
      requestedModelId: "",
      systemPrompt: resolved || f.systemPrompt
    }));
    window.localStorage.setItem("prism:last-persona", ex.persona);
    setTimeout(() => {
      leftRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  };

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch("/api/prism/router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          promptTypeCategory: selectedPromptType?.category
        })
      });
      const data = await resp.json();
      setResult({ status: resp.status, data });
    } finally {
      setLoading(false);
    }
  };

  const d = result?.data ?? {};
  const isError = d?.error;
  const hasResult = result !== null;

  const commonInputStyle = {
    width: "100%",
    border: "1px solid #dcdcdc",
    borderRadius: "6px",
    padding: "10px 12px",
    fontSize: "14px",
    color: "#161616",
    background: "#ffffff",
    boxSizing: "border-box" as const,
    fontFamily: "inherit"
  };

  const labelStyle = {
    fontSize: "11px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    color: "#525252",
    marginBottom: "6px",
    display: "block" as const
  };

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #dcdcdc",
    borderRadius: "10px",
    padding: "16px 20px",
    marginBottom: "20px"
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "#f8faff"
    }}>
      <WorkbenchHeader />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <AppSidebar />
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* LEFT CONFIG PANEL */}
          <div style={{
            width: "45%",
            overflowY: "auto",
            borderRight: "1px solid #dcdcdc",
            background: "#ffffff",
            padding: "24px"
          }} ref={leftRef}>

            <div style={{ ...cardStyle, borderLeft: `4px solid ${personaConfig.color}` }}>
              <h2 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 16px 0", color: "#161616" }}>Configuration</h2>

              {/* Persona */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Persona</label>
                <select
                  value={form.persona}
                  onChange={(e) => selectPersona(e.target.value)}
                  style={commonInputStyle as any}
                >
                  {PERSONA_NAMES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <span style={{ display: "inline-block", background: personaConfig.color, color: "white", borderRadius: 12, padding: "3px 9px", marginBottom: 16, fontSize: 12 }}>{form.persona}</span>

              {/* Task Type */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Task Type</label>
                <select value={form.taskType}
                  onChange={(e) => { const taskType = e.target.value; setForm((f) => ({ ...f, taskType, requestedModelId: "", maxTokens: taskTokenDefault(taskType) })); }}
                  style={commonInputStyle as any}>
                  {personaConfig.tasks.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>

              {/* Prompt Type */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Prompt Type</label>
                <select
                  value={form.promptTypeId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const pt = options.promptTypes.find((p) => p.promptTypeId === id);
                    setForm((f) => ({
                      ...f,
                      promptTypeId: id,
                      systemPrompt: pt ? resolveTemplate(pt.template, {
                        persona: f.persona,
                        taskType: f.taskType,
                        promptTypeName: pt.name,
                        promptTypeCategory: pt.category
                      }) : f.systemPrompt
                    }));
                  }}
                  style={commonInputStyle as any}
                >
                  {personaPromptTypes.map((pt) => (
                    <option key={pt.promptTypeId} value={pt.promptTypeId}>
                      {pt.promptTypeId} - {pt.name}
                    </option>
                  ))}
                  <option value="">Any prompt type</option>
                </select>
              </div>

              {/* Model */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Model</label>
                <select value={form.requestedModelId}
                  onChange={(e) => setForm((f) => ({ ...f, requestedModelId: e.target.value }))}
                  style={commonInputStyle as any}>
                  <option value="">Auto (from routing rules)</option>
                  {filteredModels.map((m) => <option key={`${m.provider}:${m.modelId}`} value={m.modelId}>{m.modelId}</option>)}
                </select>
              </div>

              {/* Max Tokens */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Max tokens: {form.maxTokens}</label>
                <input type="range" min={256} max={8192} step={256} value={form.maxTokens}
                  onChange={(e) => setForm((f) => ({ ...f, maxTokens: Number(e.target.value) }))}
                  style={{ width: "100%" }} />
              </div>

              {/* System Prompt */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>System Prompt</label>
                <textarea
                  value={form.systemPrompt}
                  onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
                  style={{
                    ...commonInputStyle,
                    height: "140px",
                    fontFamily: "monospace",
                    resize: "vertical"
                  } as any}
                  placeholder="System prompt..."
                />
                <div style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#525252" }}>
                  {form.systemPrompt.length} chars . ~{Math.ceil(form.systemPrompt.length / 4)} tokens
                </div>
              </div>

              {/* Quick Examples */}
              <div style={{ marginBottom: "20px" }}>
                <button
                  onClick={() => setQuickOpen((v) => !v)}
                  style={{
                    fontSize: "12px",
                    color: "#0f62fe",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                    fontWeight: 600
                  }}
                >
                  {quickOpen ? "▼" : "▶"} {quickOpen ? "Hide" : "Show"} Quick Examples ({WORKBENCH_EXAMPLES?.length || 0})
                </button>
                {quickOpen && WORKBENCH_EXAMPLES && WORKBENCH_EXAMPLES.length > 0 && (
                  <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {WORKBENCH_EXAMPLES.slice(0, 8).map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => applyExample(ex)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "11px",
                          border: "1px solid #0f62fe",
                          borderRadius: "16px",
                          background: "#f8faff",
                          color: "#0f62fe",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          fontWeight: 500
                        }}
                        onMouseOver={(e) => {
                          (e.currentTarget as any).style.background = "#0f62fe";
                          (e.currentTarget as any).style.color = "#ffffff";
                        }}
                        onMouseOut={(e) => {
                          (e.currentTarget as any).style.background = "#f8faff";
                          (e.currentTarget as any).style.color = "#0f62fe";
                        }}
                      >
                        {ex.label.split(" - ")[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* User Message */}
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>User Message</label>
                <textarea
                  value={form.userMessage}
                  onChange={(e) => setForm((f) => ({ ...f, userMessage: e.target.value }))}
                  style={{
                    ...commonInputStyle,
                    height: "110px",
                    resize: "vertical"
                  } as any}
                  placeholder="Enter your request..."
                />
              </div>

              {/* Token Meter */}
              <div>
                <label style={labelStyle}>Estimated Tokens: {estTokens} / {form.maxTokens}</label>
                <div style={{
                  width: "100%",
                  height: "6px",
                  background: "#f4f7fb",
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${Math.min((estTokens / form.maxTokens) * 100, 100)}%`,
                    height: "100%",
                    background: "#0f62fe",
                    transition: "width 0.2s"
                  }} />
                </div>
              </div>
            </div>

            {/* Identity & Plan */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#525252", margin: "0 0 12px 0", letterSpacing: "0.04em" }}>Identity Plan</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {[form.userId, form.orgId, form.role, "enterprise"].map((v) => (
                  <span key={v} style={{
                    padding: "6px 12px",
                    borderRadius: "16px",
                    border: "1px solid #dcdcdc",
                    background: "#f8faff",
                    fontSize: "12px",
                    color: "#161616"
                  }}>
                    {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={run}
              disabled={loading || !form.userMessage.trim()}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: 600,
                background: loading || !form.userMessage.trim() ? "#8a8a8a" : "#0f62fe",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: loading || !form.userMessage.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
            >
              {loading ? "Running..." : "Run Governed AI Call"}
            </button>

          </div>

          {/* RIGHT RESPONSE PANEL */}
          <div style={{
            width: "55%",
            overflowY: "auto",
            background: "#f8faff",
            padding: "24px"
          }}>
            {!hasResult ? (
              <div style={cardStyle}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#161616", margin: "0 0 8px 0" }}>🚀 Try an Example</h3>
                <p style={{ fontSize: "14px", color: "#525252", margin: "0 0 20px 0" }}>
                  Click any example to pre-fill the workbench and run instantly.
                </p>
                {WORKBENCH_EXAMPLES && WORKBENCH_EXAMPLES.length > 0 ? (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px"
                  }}>
                    {WORKBENCH_EXAMPLES.slice(0, 8).map((ex, i) => {
                      const Icon = iconMap[ex.icon] || Bot;
                      return (
                        <button
                          key={i}
                          onClick={() => applyExample(ex)}
                          style={{
                            padding: "14px",
                            border: "1px solid #dcdcdc",
                            borderRadius: "8px",
                            background: "#ffffff",
                            textAlign: "left" as const,
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseOver={(e) => {
                            (e.currentTarget as any).style.borderColor = "#0f62fe";
                            (e.currentTarget as any).style.background = "#f8faff";
                          }}
                          onMouseOut={(e) => {
                            (e.currentTarget as any).style.borderColor = "#dcdcdc";
                            (e.currentTarget as any).style.background = "#ffffff";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <Icon size={18} style={{ color: "#0f62fe" }} />
                            <span style={{ fontWeight: 600, color: "#161616", fontSize: "13px" }}>{ex.label}</span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#525252", lineHeight: "1.4" }}>
                            {ex.userMessage.slice(0, 80)}...
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#525252" }}>
                    Loading examples...
                  </div>
                )}
              </div>
            ) : (
              <div>
                {!isError && (
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: "6px",
                    borderLeft: "4px solid",
                    marginBottom: "16px",
                    background: d.ossaDecision === "allow" ? "#defbe6" : d.ossaDecision === "warn" ? "#fdf6dd" : "#fff1f1",
                    borderColor: d.ossaDecision === "allow" ? "#24a148" : d.ossaDecision === "warn" ? "#f1c21b" : "#da1e28"
                  }}>
                    <span style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: d.ossaDecision === "allow" ? "#0e6027" : d.ossaDecision === "warn" ? "#633806" : "#a2191f"
                    }}>
                      {d.ossaDecision === "allow"
                        ? "OSSA: Allowed - within budget"
                        : d.ossaDecision === "warn"
                        ? `OSSA: Warning - ${d.reason || ""}`
                        : `OSSA: Blocked - ${d.reason || ""}`}
                    </span>
                  </div>
                )}

                <div style={cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "#161616" }}>Response <span style={{ background: personaConfig.color, color: "white", padding: "3px 8px", borderRadius: 12, fontSize: 11, marginLeft: 8 }}>{form.persona}</span></h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(d.responseText ?? "");
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          border: "1px solid #dcdcdc",
                          background: copied ? "#24a148" : "#ffffff",
                          color: copied ? "#ffffff" : "#0f62fe",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => setResult(null)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          border: "1px solid #dcdcdc",
                          background: "#ffffff",
                          color: "#0f62fe",
                          borderRadius: "4px",
                          cursor: "pointer"
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <pre style={{
                    minHeight: "280px",
                    maxHeight: "400px",
                    overflowY: "auto",
                    padding: "12px",
                    background: "#ffffff",
                    border: "1px solid #dcdcdc",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    margin: 0,
                    color: "#161616"
                  }}>
                    {isError ? `Error: ${isError.message}` : d.responseText || "No response text returned."}
                  </pre>
                </div>

                {/* Metrics */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "12px",
                  marginBottom: "20px"
                }}>
                  {[
                    ["Input Tokens", d.inputTokens ?? 0],
                    ["Output Tokens", d.outputTokens ?? 0],
                    ["Cost USD", Number(d.costUsd ?? 0).toFixed(6)],
                    ["Latency ms", d.latencyMs ?? 0]
                  ].map(([label, value]) => (
                    <div key={label as string} style={{
                      background: "#ffffff",
                      border: "1px solid #dcdcdc",
                      borderRadius: "6px",
                      padding: "12px"
                    }}>
                      <div style={{ fontSize: "10px", color: "#525252", textTransform: "uppercase" }}>{label}</div>
                      <div style={{ fontSize: "16px", fontWeight: 700, color: "#161616", marginTop: "6px" }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Execution Trace */}
                <div style={cardStyle}>
                  <h3 style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "#525252", margin: "0 0 12px 0", letterSpacing: "0.04em" }}>Execution Trace</h3>
                  <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                    <li style={{ padding: "8px 12px", border: "1px solid #dcdcdc", borderRadius: "4px", background: "#f8faff", fontSize: "13px" }}>
                      1. OSSA check - {d.ossaDecision ?? "allow"}
                    </li>
                    <li style={{ padding: "8px 12px", border: "1px solid #dcdcdc", borderRadius: "4px", background: "#f8faff", fontSize: "13px" }}>
                      2. Model - {d.modelId ?? "N/A"} ({d.provider ?? "N/A"})
                    </li>
                    <li style={{ padding: "8px 12px", border: "1px solid #dcdcdc", borderRadius: "4px", background: "#f8faff", fontSize: "13px" }}>
                      3. Prompt type - {selectedPromptType?.name ?? "N/A"}
                    </li>
                    <li style={{ padding: "8px 12px", border: "1px solid #dcdcdc", borderRadius: "4px", background: "#f8faff", fontSize: "13px" }}>
                      4. Latency - {d.latencyMs ?? 0}ms
                    </li>
                    <li style={{ padding: "8px 12px", border: "1px solid #dcdcdc", borderRadius: "4px", background: "#f8faff", fontSize: "13px" }}>
                      5. Logged to governance store
                    </li>
                  </ol>
                </div>

                <button
                  onClick={() => setResult(null)}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: "#ffffff",
                    color: "#0f62fe",
                    border: "1px solid #dcdcdc",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    marginTop: "16px"
                  }}
                >
                  Try Another Example
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
