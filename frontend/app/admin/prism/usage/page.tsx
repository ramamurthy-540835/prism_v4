"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AppSidebar from "@/components/workbench/AppSidebar";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader";

const COLORS = ["#0f62fe", "#4589ff", "#24a148", "#8a3ffc", "#da1e28", "#ff832b"];

export default function UsagePage() {
  const [daily, setDaily] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userDetails, setUserDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/prism/usage/daily").then((r) => r.json()),
      fetch("/api/prism/usage/top-users").then((r) => r.json()),
    ])
      .then(([d, u]) => {
        setDaily(Array.isArray(d) ? d : []);
        setTopUsers(Array.isArray(u) ? u : []);
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => setLoading(false));
  }, []);

  const loadUserDetails = async (userId: string) => {
    setSelectedUser(userId);
    const rows = await fetch(`/api/prism/usage/user-details?userId=${encodeURIComponent(userId)}`).then((r) => r.json());
    setUserDetails(Array.isArray(rows) ? rows : []);
  };

  const usageByDay = Object.values(
    daily.reduce((acc: any, r: any) => {
      const day = String(r.day?.value ?? r.day ?? "");
      const model = String(r.modelId ?? r.model_id ?? "unknown");
      if (!acc[day]) acc[day] = { day };
      acc[day][model] = (acc[day][model] ?? 0) + Number(r.spend_usd ?? 0);
      return acc;
    }, {})
  ).sort((a: any, b: any) => String(a.day).localeCompare(String(b.day)));

  const modelKeys = Array.from(new Set(daily.map((r: any) => String(r.modelId ?? r.model_id ?? "unknown"))));
  const fmtUsd = (v: number) => (v < 0.01 ? v.toFixed(6) : v.toFixed(4));

  return (
    <div className="min-h-screen bg-white text-[#161616]" style={{ fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}>
      <WorkbenchHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 bg-[#f8faff] p-6 space-y-4">
          <div className="ibm-panel p-5">
            <h1 className="text-xl font-semibold text-[#161616]">Usage Analytics</h1>
            <p className="text-sm text-[#525252] mt-1">30-day spend by model and top users by spend.</p>
          </div>

          {error && <div className="rounded border border-[#da1e28] bg-white p-3 text-sm text-[#da1e28]">{error}</div>}

          {loading ? (
            <div className="ibm-panel p-6 text-[#525252] text-sm">Loading usage data...</div>
          ) : (
            <>
              <div className="ibm-panel p-5">
                <h2 className="text-sm font-semibold text-[#161616] mb-4">Daily Spend by Model (30 days)</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageByDay as any[]}>
                      <CartesianGrid stroke="#dcdcdc" />
                      <XAxis dataKey="day" stroke="#525252" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#525252" tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      {modelKeys.map((k, i) => (
                        <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="ibm-panel p-0 overflow-auto">
                <div className="p-4 border-b border-[#dcdcdc]">
                  <h2 className="text-sm font-semibold text-[#161616]">Top Users by Spend</h2>
                </div>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#dcdcdc]">
                      {["User ID", "Role", "Persona", "Task Type", "Calls", "Tokens", "Spend (USD)", "Blocked"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#525252]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topUsers.map((u: any, i: number) => (
                      <tr key={i} className="border-b border-[#dcdcdc] hover:bg-[#f4f7fb]">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => loadUserDetails(String(u.userId ?? u.user_id ?? ""))}
                            className="text-[#0f62fe] hover:underline"
                          >
                            {u.userId ?? u.user_id ?? "—"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-[#161616]">{u.role ?? "—"}</td>
                        <td className="px-4 py-3 text-[#161616]">{u.persona ?? "—"}</td>
                        <td className="px-4 py-3 text-[#161616]">{u.taskType ?? u.task_type ?? "—"}</td>
                        <td className="px-4 py-3 text-[#161616]">{u.calls ?? 0}</td>
                        <td className="px-4 py-3 text-[#161616]">{u.tokens ?? 0}</td>
                        <td className="px-4 py-3 text-[#161616]">{fmtUsd(Number(u.spend ?? 0))}</td>
                        <td className="px-4 py-3 text-[#da1e28]">{u.blocked ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedUser && (
                <div className="ibm-panel p-5">
                  <h2 className="text-sm font-semibold text-[#161616] mb-3">Details for {selectedUser}</h2>
                  <div className="overflow-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#dcdcdc]">
                          {(userDetails[0] ? Object.keys(userDetails[0]) : []).map((c) => (
                            <th key={c} className="px-3 py-2 text-left text-xs text-[#525252]">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {userDetails.map((row, i) => (
                          <tr key={i} className="border-b border-[#dcdcdc]">
                            {Object.keys(row).map((c) => (
                              <td key={c} className="px-3 py-2 text-[#161616] text-xs">{String(row[c] ?? "—")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
