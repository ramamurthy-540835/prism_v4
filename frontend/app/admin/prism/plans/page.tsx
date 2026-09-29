"use client";
import { useEffect, useState } from "react";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/prism/plans")
      .then((r) => r.json())
      .then((d) => setPlans(Array.isArray(d) ? d : []))
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  const columns = plans.length ? Object.keys(plans[0]) : [];

  return (
    <div className="min-h-screen bg-white text-[#161616]" style={{ fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}>
      <WorkbenchHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 bg-[#f8faff] p-6 space-y-4">
          <div className="ibm-panel p-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[#161616]">Plans</h1>
              <p className="text-sm text-[#525252] mt-1">Active plan catalog from BigQuery.</p>
            </div>
          </div>

          {error && <div className="rounded border border-[#da1e28] bg-white p-3 text-sm text-[#da1e28]">{error}</div>}
          {loading ? (
            <div className="ibm-panel p-6 text-[#525252] text-sm">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="ibm-panel p-6 text-[#525252] text-sm">No active plans found in <code>prism_plans</code>.</div>
          ) : (
            <div className="ibm-panel p-0 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dcdcdc]">
                    {columns.map((c) => (
                      <th key={c} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#525252]">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plans.map((row, i) => (
                    <tr key={i} className="border-b border-[#dcdcdc] hover:bg-[#f4f7fb]">
                      {columns.map((c) => (
                        <td key={c} className="px-4 py-3 text-[#161616]">{String(row[c] ?? "—")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
