"use client";

import { useState } from "react";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

type TestCallBody = {
  userId: string;
  userEmail: string;
  orgId: string;
  planId: string;
  role: string;
  persona: string;
  taskType: string;
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
};

const INITIAL_BODY: TestCallBody = {
  userId: "test-user",
  userEmail: "test@mastechdigital.com",
  orgId: "test-org",
  planId: "plan-starter",
  role: "admin",
  persona: "Architect",
  taskType: "architect",
  systemPrompt: "You are PRISM.",
  userMessage: "Summarize Snowflake optimization tactics",
  maxTokens: 512,
};

export default function TestCall() {
  const [body, setBody] = useState<TestCallBody>(INITIAL_BODY);
  const [out, setOut] = useState<unknown | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const onRun = async () => {
    setLoading(true);
    setErr("");
    setOut(null);
    try {
      const r = await fetch("/api/prism/router", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) setErr(JSON.stringify(j, null, 2));
      setOut(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#161616]" style={{ fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}>
      <WorkbenchHeader />
      <main className="bg-[#f8faff] p-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <div className="ibm-panel p-5 space-y-4">
            <h1 className="text-lg font-semibold">PRISM Test Call</h1>
            <p className="text-sm text-[#525252]">Send a governed router request with editable payload fields.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.keys(body).map((key) => (
                <div key={key}>
                  <label className="ibm-label block mb-1">{key}</label>
                  <input
                    className="w-full rounded border border-[#dcdcdc] bg-white px-3 py-2 text-sm text-[#161616]"
                    value={String(body[key as keyof TestCallBody])}
                    onChange={(e) =>
                      setBody((prev) => ({
                        ...prev,
                        [key]: key === "maxTokens" ? Number(e.target.value) : e.target.value,
                      }))
                    }
                    placeholder={key}
                  />
                </div>
              ))}
            </div>

            <button
              className="ibm-btn-primary px-5 py-2 text-sm font-semibold rounded disabled:opacity-60"
              onClick={onRun}
              disabled={loading}
            >
              {loading ? "Running..." : "Run Governed Call"}
            </button>
          </div>

          {err && (
            <div className="ibm-panel border border-[#da1e28] bg-[#fff1f1] p-4">
              <h2 className="text-sm font-semibold text-[#a2191f]">Error</h2>
              <pre className="mt-2 overflow-auto text-xs text-[#a2191f]">{err}</pre>
            </div>
          )}

          {out && (
            <div className="ibm-panel p-4">
              <h2 className="text-sm font-semibold">Response</h2>
              <pre className="mt-2 overflow-auto rounded border border-[#dcdcdc] bg-white p-3 text-xs text-[#161616]">
                {JSON.stringify(out, null, 2)}
              </pre>
            </div>
          ) as any}
        </div>
      </main>
    </div>
  );
}
