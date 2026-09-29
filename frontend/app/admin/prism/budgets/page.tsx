"use client";
import { useEffect, useState } from "react";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/prism/budgets")
      .then((r) => r.json())
      .then((d) => setBudgets(Array.isArray(d) ? d : []))
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  const columns = budgets.length ? Object.keys(budgets[0]) : [];

  return (
    <div className="min-h-screen bg-white text-[#161616]" style={{ fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}>
      <WorkbenchHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 bg-[#f8faff] p-6 space-y-4">
          <div className="ibm-panel p-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[#161616]">OSSA Budgets</h1>
              <p className="text-sm text-[#525252] mt-1">Active budget policies from BigQuery.</p>
            </div>
          </div>

          {error && <div className="rounded border border-[#da1e28] bg-white p-3 text-sm text-[#da1e28]">{error}</div>}
          {loading ? (
            <div className="ibm-panel p-6 text-[#525252] text-sm">Loading budgets...</div>
          ) : budgets.length === 0 ? (
            <div className="ibm-panel p-6 text-[#525252] text-sm">No active budgets found in <code>prism_budgets</code>.</div>
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
                  {budgets.map((row, i) => (
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
