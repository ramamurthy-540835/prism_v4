"use client";
import { useEffect, useState } from "react";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

export default function AuditPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = (uid?: string) => {
    setLoading(true);
    setError("");
    const url = uid ? `/api/prism/usage/user-details?userId=${encodeURIComponent(uid)}` : "/api/prism/usage/user-details";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const columns = rows.length ? Object.keys(rows[0]) : [];

  const decisionColor = (d: string) =>
    d === "allow" ? "#24a148" : d === "warn" ? "#f1c21b" : d === "stop" || d === "blocked" ? "#da1e28" : "#525252";

  return (
    <div className="min-h-screen bg-white text-[#161616]" style={{ fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}>
      <WorkbenchHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 bg-[#f8faff] p-6 space-y-4">
          <div className="ibm-panel p-5">
            <h1 className="text-xl font-semibold text-[#161616]">Audit Logs</h1>
            <p className="text-sm text-[#525252] mt-1">Last 100 AI call records from BigQuery.</p>
          </div>

          <div className="ibm-panel p-4 flex items-center gap-3">
            <label className="ibm-label shrink-0">Filter by User ID</label>
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1 rounded border border-[#dcdcdc] bg-white px-3 py-2 text-sm"
              placeholder="Leave blank for all recent records"
              onKeyDown={(e) => e.key === "Enter" && load(userId || undefined)}
            />
            <button onClick={() => load(userId || undefined)} className="ibm-btn-primary px-4 py-2 text-sm">Search</button>
            <button onClick={() => { setUserId(""); load(); }} className="ibm-btn-secondary px-4 py-2 text-sm">Reset</button>
          </div>

          {error && <div className="rounded border border-[#da1e28] bg-white p-3 text-sm text-[#da1e28]">{error}</div>}

          {loading ? (
            <div className="ibm-panel p-6 text-[#525252] text-sm">Loading audit logs...</div>
          ) : rows.length === 0 ? (
            <div className="ibm-panel p-6 text-[#525252] text-sm">No records found.</div>
          ) : (
            <div className="ibm-panel p-0 overflow-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-[#dcdcdc]">
                    {columns.map((c) => (
                      <th key={c} className="px-3 py-3 text-left font-semibold uppercase tracking-wide text-[#525252] whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-[#dcdcdc] hover:bg-[#f4f7fb]">
                      {columns.map((c) => (
                        <td key={c} className="px-3 py-2 whitespace-nowrap" style={{ color: c === "decision" ? decisionColor(String(row[c] ?? "")) : "#161616" }}>
                          {String(row[c] ?? "—")}
                        </td>
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
