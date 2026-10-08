"use client";
import { useState } from "react";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setNotice("");
    const response = await fetch("/api/prism/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, message }) });
    const result = await response.json();
    setNotice(response.ok ? `Report submitted. Ticket ${result.ticketId}` : result.error || "Could not submit report.");
    if (response.ok) { setSubject(""); setMessage(""); }
  };
  return <div className="min-h-screen bg-white text-[#161616]"><WorkbenchHeader /><div className="flex"><AppSidebar />
    <main className="flex-1 bg-[#f8faff] p-6 space-y-5"><h1 className="text-2xl font-semibold">Support</h1>
      <p>Contact <a href="mailto:ai@nelture.ai" className="text-[#0f62fe]">ai@nelture.ai</a> or WhatsApp <a href="https://wa.me/918925310144" className="text-[#0f62fe]">+91 89253 10144</a>.</p>
      <form onSubmit={submit} className="ibm-panel p-5 grid gap-4 max-w-2xl"><h2 className="font-semibold">Report a problem</h2>
        <label>Subject<input className="block border rounded p-2 w-full" required maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
        <label>What happened?<textarea className="block border rounded p-2 w-full min-h-32" required maxLength={10000} value={message} onChange={(e) => setMessage(e.target.value)} /></label>
        <button className="ibm-btn-primary p-2" type="submit">Send report</button>{notice && <p role="status">{notice}</p>}
      </form>
    </main></div></div>;
}
