"use client";

import { useState } from "react";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";
import { GST_EASY_V3_LOGIN_URL, GST_EASY_V3_REGISTER_URL, gstEasyDemoPaths } from "@/config/gst-easy";

export default function PartnerGstPage() {
  const [pageName, setPageName] = useState("");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const message = `GST Easy V3 demo feedback\nPage: ${pageName}\nSteps to reproduce: ${steps}\nExpected: ${expected}\nActual: ${actual}\nSuggestion: ${suggestion || "None"}`;
      const response = await fetch("/api/prism/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: `GST Easy V3: ${pageName}`, message }) });
      const result = await response.json();
      if (result.ticketId) {
        setNotice(response.ok ? `Feedback submitted. Ticket ${result.ticketId}.` : `Feedback saved as ticket ${result.ticketId}; ${result.error || "email delivery needs attention"}.`);
        setPageName(""); setSteps(""); setExpected(""); setActual(""); setSuggestion("");
      } else setNotice(result.error || "Could not save feedback. Sign in to PRISM and retry.");
    } catch { setNotice("Could not save feedback. Please retry."); }
    finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-white text-[#161616]"><WorkbenchHeader /><div className="flex"><AppSidebar />
    <main className="flex-1 bg-[#f8faff] p-6 space-y-6 min-w-0"><header><h1 className="text-2xl font-semibold">Partner GST input · GST Easy V3</h1><p className="mt-2 text-sm text-[#525252]">GST invoices, reconciliation, returns, and reports run in the separate GST Easy V3 application. PRISM collects demo feedback here.</p></header>
      <section className="ibm-panel p-5 space-y-3"><h2 className="font-semibold">Open GST Easy V3</h2><p className="text-sm">Use the demo login or register with your own email and complete verification. GST Easy uses its own sign-in.</p><div className="flex flex-wrap gap-3"><a className="ibm-btn-primary px-4 py-2" href={GST_EASY_V3_LOGIN_URL} target="_blank" rel="noreferrer">Open application</a><a className="ibm-btn-secondary px-4 py-2" href={GST_EASY_V3_REGISTER_URL} target="_blank" rel="noreferrer">Register new user</a></div></section>
      <section className="grid gap-4 lg:grid-cols-2">{gstEasyDemoPaths.map((path) => <article key={path.email} className="ibm-panel p-5 space-y-2"><h2 className="font-semibold">{path.title}</h2><p className="text-sm">{path.description}</p><p className="text-sm"><span className="font-medium">Demo email:</span> {path.email}</p><p className="text-xs text-[#525252]">Use the demo password supplied by the project owner. Only synthetic data should be entered.</p></article>)}</section>
      <form onSubmit={submit} className="ibm-panel p-5 grid gap-3 max-w-3xl"><h2 className="font-semibold">Report an issue or improvement</h2><p className="text-sm text-[#525252]">Include the page, steps, and what you expected. Share screenshots with the project owner when helpful; this form does not upload files. PRISM sign-in is required to submit here. Partners without PRISM access can <a className="text-blue-700 underline" href="mailto:ai@nelture.ai?subject=GST%20Easy%20V3%20demo%20feedback">send feedback by email</a>.</p>
        <label className="text-sm">Page name<input className="block border rounded p-2 w-full" required maxLength={120} value={pageName} onChange={(event) => setPageName(event.target.value)} /></label>
        <label className="text-sm">Steps to reproduce<textarea className="block border rounded p-2 w-full min-h-24" required maxLength={3000} value={steps} onChange={(event) => setSteps(event.target.value)} /></label>
        <label className="text-sm">Expected result<textarea className="block border rounded p-2 w-full min-h-20" required maxLength={2000} value={expected} onChange={(event) => setExpected(event.target.value)} /></label>
        <label className="text-sm">Actual result<textarea className="block border rounded p-2 w-full min-h-20" required maxLength={2000} value={actual} onChange={(event) => setActual(event.target.value)} /></label>
        <label className="text-sm">Suggestion (optional)<textarea className="block border rounded p-2 w-full min-h-20" maxLength={2000} value={suggestion} onChange={(event) => setSuggestion(event.target.value)} /></label>
        <button className="ibm-btn-primary px-4 py-2 justify-self-start" type="submit" disabled={busy}>{busy ? "Saving…" : "Send feedback"}</button>{notice && <p role="status" className="text-sm">{notice}</p>}
      </form>
    </main></div></div>;
}
