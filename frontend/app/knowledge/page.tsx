"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Doc = { document_id: string; title: string; filename: string; status: string; protection_level: string; visibility: string; chunk_count: number; embedded_count: number; size_bytes?: number; owner_id: string; status_detail?: string };
type Result = { chunk_id: string; title: string; page_start?: number; section_path?: string; text: string; score: number; source_uri: string };
const API = process.env.NEXT_PUBLIC_KNOWLEDGE_API_URL || "http://localhost:8001/api/knowledge";

function tokenHeaders() {
  const token = typeof window === "undefined" ? "" : window.localStorage.getItem("PRISM_ID_TOKEN") || "";
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

const statusClass = (status: string) => status === "ready" ? "bg-emerald-500/20 text-emerald-300" : ["failed", "quarantined"].includes(status) ? "bg-red-500/20 text-red-300" : "bg-amber-400/15 text-amber-200";

export default function KnowledgePage() {
  const [file, setFile] = useState<File | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [message, setMessage] = useState("Connect Firebase sign-in to load documents.");
  const [level, setLevel] = useState("internal");
  const [visibility, setVisibility] = useState("private");
  const [selected, setSelected] = useState<Doc | null>(null);

  const refresh = async () => {
    const response = await fetch(`${API}/documents`, { headers: tokenHeaders() });
    if (response.ok) setDocs(await response.json());
  };
  useEffect(() => { refresh().catch(() => undefined); }, []);

  const upload = async () => {
    if (!file) return;
    const content = await file.arrayBuffer();
    const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", content))).map(v => v.toString(16).padStart(2, "0")).join("");
    const metadata = { filename: file.name, mime_type: file.type || "text/plain", content_sha256: digest, title: file.name, protection_level: level, visibility, tags: [] };
    const response = await fetch(`${API}/documents/upload-url`, { method: "POST", headers: tokenHeaders(), body: JSON.stringify({ ...metadata, size_bytes: file.size }) });
    if (!response.ok) return setMessage(await response.text());
    const upload = await response.json();
    const put = await fetch(upload.upload_url, { method: "PUT", headers: { "Content-Type": metadata.mime_type }, body: file });
    if (!put.ok) return setMessage("Upload to Cloud Storage failed.");
    const finalize = await fetch(`${API}/documents/${upload.document_id}/finalize`, { method: "POST", headers: tokenHeaders(), body: JSON.stringify(metadata) });
    setMessage(finalize.ok ? "Uploaded — ingestion is now running." : await finalize.text());
    if (finalize.ok) refresh();
  };

  const search = async () => {
    const response = await fetch(`${API}/search`, { method: "POST", headers: tokenHeaders(), body: JSON.stringify({ query }) });
    if (!response.ok) return setMessage(await response.text());
    setResults((await response.json()).results);
  };

  return <main className="min-h-screen bg-[#07111d] px-6 py-8 text-slate-100">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-xl border border-cyan-900/60 bg-[#0b1726] p-6 shadow-2xl shadow-cyan-950/30">
        <p className="text-xs uppercase tracking-[.25em] text-cyan-400">PRISM / Knowledge Layer</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold">Governed document retrieval</h1><p className="mt-1 text-sm text-slate-400">Every retrieved chunk is attributable, policy-checked, and auditable.</p></div><span className="rounded border border-cyan-600/50 px-3 py-1 text-xs text-cyan-300">MODEL ARMOR READY</span></div>
      </header>
      <p className="rounded border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">{message}</p>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-xl border border-slate-700 bg-[#0b1726] p-5"><h2 className="font-medium">Upload evidence</h2><label className="mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-cyan-700 bg-cyan-950/15 text-sm text-slate-400"><input className="hidden" type="file" accept=".pdf,.docx,.md,.txt,.csv,.xlsx,.html" onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)} /><span>{file ? file.name : "Drop PDF, DOCX, MD, TXT, CSV, or XLSX"}</span><span className="mt-1 text-xs">50 MB maximum · provenance retained</span></label><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><label>Protection<select className="mt-1 w-full rounded bg-slate-900 p-2" value={level} onChange={e => setLevel(e.target.value)}><option value="public">Public</option><option value="internal">Internal</option><option value="confidential">Confidential</option><option value="critical">Critical — users only</option></select></label><label>Visibility<select className="mt-1 w-full rounded bg-slate-900 p-2" value={visibility} onChange={e => setVisibility(e.target.value)}><option value="private">Private</option><option value="project">Project</option><option value="org">Organisation</option></select></label></div><button onClick={upload} className="mt-4 rounded bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950">Upload and ingest</button></div>
        <div className="rounded-xl border border-slate-700 bg-[#0b1726] p-5"><h2 className="font-medium">Budgets & controls</h2><div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs"><Card label="Storage" value="— / limit" /><Card label="Embed spend" value="— / month" /><Card label="Retrievals" value="— / today" /></div><div className="mt-5 rounded border border-slate-700 p-3 text-xs text-slate-400"><p className="text-slate-200">Protection guide</p><p className="mt-2">Public/Internal: authorised access · Confidential: project scope · Critical: agents denied.</p></div></div>
      </section>
      <section className="rounded-xl border border-slate-700 bg-[#0b1726] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-medium">Document telemetry</h2><button className="text-sm text-cyan-300" onClick={refresh}>Refresh</button></div><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-700 text-xs uppercase text-slate-500"><tr><th className="pb-2">Document</th><th>Status</th><th>Chunks</th><th>Protection</th><th>Owner</th></tr></thead><tbody>{docs.map(doc => <tr key={doc.document_id} onClick={() => setSelected(doc)} className="cursor-pointer border-b border-slate-800 hover:bg-slate-800/50"><td className="py-3">{doc.title}<span className="block text-xs text-slate-500">{doc.filename}</span></td><td><span className={`rounded px-2 py-1 text-xs ${statusClass(doc.status)}`}>{doc.status}</span></td><td>{doc.chunk_count} / {doc.embedded_count}</td><td>{doc.protection_level}</td><td>{doc.owner_id}</td></tr>)}</tbody></table></div></section>
      <section className="rounded-xl border border-slate-700 bg-[#0b1726] p-5"><h2 className="font-medium">Transparent search console</h2><div className="mt-3 flex gap-2"><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && search()} placeholder="Ask your governed knowledge base…" className="min-w-0 flex-1 rounded bg-slate-900 px-3 py-2 text-sm" /><button onClick={search} className="rounded border border-cyan-600 px-4 text-sm text-cyan-300">Search</button></div><p className="mt-2 text-xs text-slate-500">ACL and protection predicates are applied before vector search; results include page and section provenance.</p><div className="mt-4 space-y-3">{results.map((result, index) => <article key={result.chunk_id} className="rounded border border-slate-700 p-3"><p className="text-xs text-cyan-300">[{index + 1}] {result.title} · p.{result.page_start || "?"} · {result.section_path || "Document"} · score {result.score?.toFixed(3)}</p><p className="mt-2 text-sm text-slate-300">{result.text}</p></article>)}</div></section>
      {selected && <aside className="fixed inset-y-0 right-0 w-full max-w-md border-l border-cyan-800 bg-[#0b1726] p-6 shadow-2xl"><button className="float-right text-slate-400" onClick={() => setSelected(null)}>Close</button><p className="text-xs uppercase tracking-widest text-cyan-400">Document detail</p><h2 className="mt-2 text-xl">{selected.title}</h2><p className="mt-5 text-sm text-slate-400">Pipeline: {selected.status}</p><p className="mt-2 text-sm text-slate-400">Chunks {selected.chunk_count} · Embeddings {selected.embedded_count}</p><p className="mt-2 text-sm text-slate-400">DLP and ACL telemetry will populate after authenticated API integration.</p></aside>}
    </div>
  </main>;
}

function Card({ label, value }: { label: string; value: string }) { return <div className="rounded border border-slate-700 bg-slate-900 p-3"><p className="text-slate-500">{label}</p><p className="mt-1 text-slate-200">{value}</p></div>; }
