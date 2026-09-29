"use client";
import { useEffect, useState, useCallback, Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DollarSign, Zap, Users, ShieldX, BarChart2,
  Code2, Network, TestTube2, ClipboardCheck, LineChart as LineChartIcon, Bot, GraduationCap, BookOpen,
  RefreshCw, Copy, Check,
} from "lucide-react";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip as ChartTooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import AppSidebar from "@/components/workbench/AppSidebar";

// ── Constants ──────────────────────────────────────────────────────────────────

const CHART_COLORS = ["#0f62fe", "#4589ff", "#0043ce", "#002d9c", "#ee5396"];

const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  Reasoning:   { bg: "#edf5ff", color: "#0043ce" },
  Instruction: { bg: "#d9fbfb", color: "#005d5d" },
  Agentic:     { bg: "#fef6de", color: "#8e5600" },
  Retrieval:   { bg: "#defbe6", color: "#0e6027" },
  "Few-Shot":  { bg: "#f6f2ff", color: "#6929c4" },
  Emotional:   { bg: "#ffd6e8", color: "#9f1853" },
};

const PERSONA_META = [
  { name: "Developer",        icon: Code2,          tasks: "6 task types" },
  { name: "Architect",        icon: Network,         tasks: "5 task types" },
  { name: "Tester",           icon: TestTube2,       tasks: "4 task types" },
  { name: "QA",               icon: ClipboardCheck,  tasks: "4 task types" },
  { name: "Business Analyst", icon: LineChartIcon,   tasks: "5 task types" },
  { name: "AI Engineer",      icon: Bot,             tasks: "6 task types" },
  { name: "Mentor",           icon: GraduationCap,   tasks: "4 task types" },
  { name: "Student",          icon: BookOpen,        tasks: "3 task types" },
];

const SEED_SQL = `DELETE FROM \`ctoteam.prism.prism_plans\` WHERE 1=1;

INSERT INTO \`ctoteam.prism.prism_plans\`
  (planId, planName, monthlyPriceUsd, yearlyPriceUsd, maxUsers,
   monthlyTokenLimit, monthlySpendLimitUsd, allowedModels,
   maxTokensPerCall, isActive, createdAt)
VALUES
  ('community',  'Community',  0,  0,   1,   200000,    3,     '["gemini-2.0-flash"]',                                                2048,  TRUE, CURRENT_TIMESTAMP()),
  ('student',    'Student',    0,  0,   1,   500000,    5,     '["gemini-2.0-flash","gemini-2.5-flash"]',                             4096,  TRUE, CURRENT_TIMESTAMP()),
  ('developer',  'Developer',  9,  85,  1,   2000000,   40,    '["gemini-2.5-flash","gpt-4o-mini","claude-sonnet-4-6"]',              8192,  TRUE, CURRENT_TIMESTAMP()),
  ('team',       'Team',       15, 144, 20,  10000000,  200,   '["gemini-2.5-flash","gpt-4o-mini","claude-sonnet-4-6"]',              8192,  TRUE, CURRENT_TIMESTAMP()),
  ('business',   'Business',   29, 278, 100, 50000000,  800,   '["gpt-4o","claude-sonnet-4-6","gemini-2.5-flash","gemini-2.0-flash"]',16384, TRUE, CURRENT_TIMESTAMP()),
  ('enterprise', 'Enterprise', 49, 470, 999, 999999999, 99999, '["gpt-4o","claude-sonnet-4-6","gemini-2.5-flash","gemini-2.0-flash"]',32768, TRUE, CURRENT_TIMESTAMP());`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtUsd(v: number) {
  return v < 0.01 ? `$${v.toFixed(6)}` : `$${v.toFixed(2)}`;
}

function fmtTokens(v: number) {
  if (v >= 999_000_000) return "Unlimited";
  if (v >= 100_000_000) return "Unlimited";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function fmtUsers(v: number) {
  if (v >= 999) return "Unlimited";
  if (v === 1) return "1 user";
  return `Up to ${v}`;
}

function tierMeta(planId: string) {
  const id = String(planId ?? "").toLowerCase();
  if (id.includes("community"))    return { color: "#24a148", dot: "#24a148", popular: false };
  if (id.includes("student"))      return { color: "#24a148", dot: "#24a148", popular: false };
  if (id.includes("developer"))    return { color: "#0f62fe", dot: "#0f62fe", popular: false };
  if (id.includes("starter"))      return { color: "#0f62fe", dot: "#0f62fe", popular: false };
  if (id.includes("professional") || id.includes("pro")) return { color: "#8a3ffc", dot: "#8a3ffc", popular: false };
  if (id.includes("team"))         return { color: "#0f62fe", dot: "#0f62fe", popular: true };
  if (id.includes("business"))     return { color: "#e8a000", dot: "#e8a000", popular: false };
  if (id.includes("enterprise"))   return { color: "#002d9c", dot: "#002d9c", popular: false };
  return { color: "#525252", dot: "#525252", popular: false };
}

function vsCompetitor(planId: string): string {
  const id = String(planId ?? "").toLowerCase();
  if (id.includes("community"))  return "free (Copilot Free: 2K completions)";
  if (id.includes("student"))    return "free (Copilot student pack)";
  if (id.includes("developer"))  return "$1 below Copilot Pro ($10)";
  if (id.includes("starter"))    return "$1 below Copilot Pro ($10)";
  if (id.includes("team"))       return "$4 below Copilot Business ($19)";
  if (id.includes("business"))   return "$10 below Cursor Teams ($40)";
  if (id.includes("enterprise")) return "custom (vs $39–59 Tabnine Ent)";
  return "-";
}

function providerBadge(p: string) {
  const s = String(p ?? "").toLowerCase();
  if (s.includes("openai"))    return { label: "OpenAI",    bg: "#edf5ff", color: "#0043ce" };
  if (s.includes("anthropic") || s.includes("claude")) return { label: "Anthropic", bg: "#fff2e8", color: "#8a3800" };
  if (s.includes("google") || s.includes("gemini"))    return { label: "Google",    bg: "#defbe6", color: "#0e6027" };
  return { label: p, bg: "#f4f7fb", color: "#525252" };
}

function parseModels(raw: any): string[] {
  if (!raw) return [];
  try {
    if (Array.isArray(raw)) return raw;
    return JSON.parse(String(raw));
  } catch { return []; }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "white", border: "1px solid #dcdcdc", borderRadius: 10,
      padding: "20px 24px", ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, badge, right }: { title: string; badge?: string | number; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#161616" }}>{title}</span>
        {badge !== undefined && (
          <span style={{ background: "#e8f0fe", color: "#0f62fe", borderRadius: 12, fontSize: 11, padding: "2px 8px" }}>
            {badge}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ background: bg, color, borderRadius: 20, fontSize: 11, fontWeight: 500, padding: "2px 10px", display: "inline-block" }}>
      {label}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      background: "#f4f7fb", color: "#525252", fontSize: 11, textTransform: "uppercase",
      letterSpacing: ".04em", padding: "8px 12px", borderBottom: "1px solid #dcdcdc",
      textAlign: "left", fontWeight: 600,
    }}>
      {children}
    </th>
  );
}

function Td({ children, style, title }: { children: React.ReactNode; style?: React.CSSProperties; title?: string }) {
  return (
    <td title={title} style={{ color: "#161616", fontSize: 13, padding: "10px 12px", borderBottom: "1px solid #f4f7fb", ...style }}>
      {children}
    </td>
  );
}

function CustomChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #dcdcdc", borderRadius: 8, padding: "10px 14px" }}>
      <p style={{ color: "#161616", fontWeight: 600, marginBottom: 4, fontSize: 12, margin: "0 0 4px" }}>{label}</p>
      {payload.map((e: any) => (
        <p key={e.dataKey} style={{ color: e.color, fontSize: 12, margin: 0 }}>
          {e.name}: {fmtUsd(Number(e.value))}
        </p>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text, sub, linkHref, linkLabel }: {
  icon: React.ElementType; text: string; sub: string; linkHref?: string; linkLabel?: string;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: 200, border: "1px dashed #dcdcdc", borderRadius: 8, gap: 8,
    }}>
      <Icon size={40} style={{ color: "#dcdcdc" }} />
      <span style={{ fontSize: 14, fontWeight: 500, color: "#525252" }}>{text}</span>
      <span style={{ fontSize: 12, color: "#8d8d8d", textAlign: "center", maxWidth: 300 }}>{sub}</span>
      {linkHref && linkLabel && (
        <Link href={linkHref} style={{
          marginTop: 8, background: "#0f62fe", color: "white", borderRadius: 6,
          padding: "8px 16px", fontSize: 13, textDecoration: "none",
        }}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const SAFE_SUMMARY = { total_spend: 0, total_tokens: 0, active_users: 0, blocked_calls: 0 };

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});
  const [health, setHealth] = useState<{ status: string; message?: string; tableCount?: number }>({ status: "loading" });
  const [countdown, setCountdown] = useState(30);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [userDetailsMap, setUserDetailsMap] = useState<Record<string, any[]>>({});
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [healthRes, summaryRes, plansRes, topUsersRes, dailyRes, routingRes, promptTypesRes, budgetsRes, columnsRes] =
      await Promise.allSettled([
        fetch("/api/prism/health").then((r) => r.json()),
        fetch("/api/prism/summary").then((r) => r.json()),
        fetch("/api/prism/plans").then((r) => r.json()),
        fetch("/api/prism/usage/top-users").then((r) => r.json()),
        fetch("/api/prism/usage/daily").then((r) => r.json()),
        fetch("/api/prism/routing").then((r) => r.json()),
        fetch("/api/prism/prompt-types").then((r) => r.json()),
        fetch("/api/prism/budgets").then((r) => r.json()),
        fetch("/api/prism/plans/columns").then((r) => r.json()),
      ]);

    setHealth(healthRes.status === "fulfilled" ? healthRes.value : { status: "error", message: "Health check failed" });

    if (columnsRes.status === "fulfilled" && Array.isArray(columnsRes.value)) {
      console.log("[PRISM] prism_plans columns:", columnsRes.value);
    }

    const asArr = (r: PromiseSettledResult<any>) =>
      r.status === "fulfilled" && Array.isArray(r.value) ? r.value : [];

    setData({
      summary: summaryRes.status === "fulfilled" ? summaryRes.value : SAFE_SUMMARY,
      plans:       asArr(plansRes),
      topUsers:    asArr(topUsersRes),
      daily:       asArr(dailyRes),
      routing:     routingRes.status === "fulfilled" && Array.isArray(routingRes.value) ? routingRes.value : [],
      promptTypes: asArr(promptTypesRes),
      budgets:     asArr(budgetsRes),
    });
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { loadData(); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [loadData]);

  // ── Derived state ────────────────────────────────────────────────────────────

  const summary   = data.summary   ?? SAFE_SUMMARY;
  const plans     = data.plans     ?? [];
  const topUsers  = data.topUsers  ?? [];
  const daily     = data.daily     ?? [];
  const routing   = data.routing   ?? [];
  const promptTypes = data.promptTypes ?? [];
  const budgets   = data.budgets   ?? [];

  const rawByDay: Record<string, any> = {};
  for (const r of daily as any[]) {
    const day = String(r.day?.value ?? r.day ?? "");
    const model = String(r.modelId ?? "unknown");
    rawByDay[day] = rawByDay[day] ?? { day };
    rawByDay[day][model] = Number(r.spend_usd ?? 0);
  }
  const usageByModelDay: any[] = Object.values(rawByDay).sort(
    (a: any, b: any) => String(a.day).localeCompare(String(b.day))
  );

  const modelKeys: string[] = Array.from(new Set(daily.map((r: any) => String(r.modelId ?? "unknown"))));

  const promptsByCategory = promptTypes.reduce((acc: Record<string, any[]>, pt: any) => {
    const cat = String(pt.category ?? "Other");
    acc[cat] = acc[cat] ?? [];
    acc[cat].push(pt);
    return acc;
  }, {} as Record<string, any[]>);

  const blockedCount = Number(summary.blocked_calls ?? summary.blockedCalls ?? 0);

  // Date range label for chart
  const dateRange = (() => {
    if (usageByModelDay.length === 0) return "Last 30 days";
    const first = String((usageByModelDay[0] as any).day ?? "").slice(0, 10);
    const last  = String((usageByModelDay[usageByModelDay.length - 1] as any).day ?? "").slice(0, 10);
    return `${first} → ${last}`;
  })();

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleRefreshAll = () => {
    setCountdown(30);
    loadData();
  };

  const handleCopySeed = () => {
    navigator.clipboard.writeText(SEED_SQL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleUserDetails = async (userId: string) => {
    const next = new Set(expandedUsers);
    if (next.has(userId)) { next.delete(userId); setExpandedUsers(next); return; }
    next.add(userId);
    setExpandedUsers(next);
    if (!userDetailsMap[userId]) {
      const rows = await fetch(`/api/prism/usage/user-details?userId=${encodeURIComponent(userId)}`).then((r) => r.json());
      setUserDetailsMap((prev) => ({ ...prev, [userId]: Array.isArray(rows) ? rows : [] }));
    }
  };

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}>
      <AppSidebar />

      <main style={{ flex: 1, background: "#f8faff", padding: 32, overflow: "auto", minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: "#161616", margin: 0 }}>PRISM Admin Dashboard</h1>
            <p style={{ fontSize: 14, color: "#525252", margin: "4px 0 0" }}>Governance · Model Routing · Budgets · Usage Audit</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link href="/admin/prism/workbench" style={{
              background: "#0f62fe", color: "white", borderRadius: 6,
              padding: "8px 16px", fontSize: 13, textDecoration: "none",
            }}>
              Open Workbench
            </Link>
            <button onClick={handleRefreshAll} style={{
              background: "white", color: "#0f62fe", border: "1px solid #0f62fe",
              borderRadius: 6, padding: "8px 16px", fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <RefreshCw size={13} />
              Refresh All
            </button>
            <div style={{ fontSize: 12, color: "#525252", textAlign: "right" }}>
              {lastUpdated && <div>Updated: {fmtTime(lastUpdated)}</div>}
              <div>Next refresh in: {countdown}s</div>
            </div>
          </div>
        </div>

        {/* BigQuery status bar */}
        {health.status === "loading" ? (
          <div style={{ height: 40, background: "white", border: "1px solid #dcdcdc", borderRadius: 6, display: "flex", alignItems: "center", padding: "0 16px", fontSize: 13, color: "#525252", marginBottom: 20 }}>
            Checking BigQuery connection…
          </div>
        ) : health.status === "ok" ? (
          <div style={{ height: 40, background: "#defbe6", border: "1px solid #24a148", borderRadius: 6, display: "flex", alignItems: "center", padding: "0 16px", fontSize: 13, color: "#0e6027", fontWeight: 500, gap: 6, marginBottom: 20 }}>
            ● BigQuery connected — ctoteam.prism
            {health.tableCount != null && ` · ${health.tableCount} tables`}
          </div>
        ) : (
          <div style={{ background: "#fff1f1", border: "1px solid #da1e28", borderRadius: 6, display: "flex", flexWrap: "wrap", alignItems: "center", padding: "8px 16px", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#a2191f" }}>● BigQuery error — check GOOGLE_APPLICATION_CREDENTIALS</span>
            {health.message && <span style={{ fontSize: 12, color: "#a2191f" }}>{health.message}</span>}
          </div>
        )}

        {loading ? (
          <div style={{ color: "#525252", padding: "40px 0", textAlign: "center" }}>Loading dashboard…</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {/* Spend */}
              <div style={{
                background: "white", border: "1px solid #dcdcdc", borderRadius: 10, overflow: "hidden",
                borderTop: "4px solid #0f62fe",
              }}>
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <DollarSign size={20} style={{ color: "#0f62fe" }} />
                    <span style={{ fontSize: 12, color: "#525252", fontWeight: 500 }}>Total Spend MTD</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 600, color: "#161616" }}>
                    {fmtUsd(Number(summary.total_spend ?? summary.totalSpend ?? 0))}
                  </div>
                  <div style={{ fontSize: 12, color: "#8d8d8d", marginTop: 2 }}>month to date</div>
                </div>
              </div>

              {/* Tokens */}
              <div style={{ background: "white", border: "1px solid #dcdcdc", borderRadius: 10, overflow: "hidden", borderTop: "4px solid #0f62fe" }}>
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Zap size={20} style={{ color: "#0f62fe" }} />
                    <span style={{ fontSize: 12, color: "#525252", fontWeight: 500 }}>Total Tokens MTD</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 600, color: "#161616" }}>
                    {Number(summary.total_tokens ?? summary.totalTokens ?? 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: "#8d8d8d", marginTop: 2 }}>input + output tokens</div>
                </div>
              </div>

              {/* Active users */}
              <div style={{ background: "white", border: "1px solid #dcdcdc", borderRadius: 10, overflow: "hidden", borderTop: "4px solid #0f62fe" }}>
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Users size={20} style={{ color: "#0f62fe" }} />
                    <span style={{ fontSize: 12, color: "#525252", fontWeight: 500 }}>Active Users</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 600, color: "#161616" }}>
                    {Number(summary.active_users ?? summary.activeUsers ?? 0)}
                  </div>
                  <div style={{ fontSize: 12, color: "#8d8d8d", marginTop: 2 }}>unique users this month</div>
                </div>
              </div>

              {/* Blocked */}
              <div style={{
                background: "white",
                border: `1px solid ${blockedCount > 0 ? "#da1e28" : "#dcdcdc"}`,
                borderRadius: 10, overflow: "hidden",
                borderTop: `4px solid ${blockedCount > 0 ? "#da1e28" : "#0f62fe"}`,
              }}>
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <ShieldX size={20} style={{ color: blockedCount > 0 ? "#da1e28" : "#0f62fe" }} />
                    <span style={{ fontSize: 12, color: "#525252", fontWeight: 500 }}>Blocked Calls</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 600, color: blockedCount > 0 ? "#da1e28" : "#161616" }}>
                    {blockedCount}
                  </div>
                  <div style={{ fontSize: 12, color: "#8d8d8d", marginTop: 2 }}>OSSA hard stops</div>
                </div>
              </div>
            </div>

            {/* Row 2: 60/40 split */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, alignItems: "start" }}>

              {/* Left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Chart */}
                <Card>
                  <SectionHeader
                    title="Daily Spend by Model"
                    badge={modelKeys.length > 0 ? `${modelKeys.length} models` : undefined}
                    right={<span style={{ fontSize: 12, color: "#525252" }}>{dateRange}</span>}
                  />
                  {usageByModelDay.length === 0 ? (
                    <div style={{
                      height: 280, border: "1px dashed #dcdcdc", borderRadius: 8,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                    }}>
                      <BarChart2 size={48} style={{ color: "#dcdcdc" }} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#525252" }}>No usage data yet</span>
                      <span style={{ fontSize: 12, color: "#8d8d8d", textAlign: "center", maxWidth: 300 }}>
                        Make governed AI calls via the Workbench to see spend by model here.
                      </span>
                      <Link href="/admin/prism/workbench" style={{
                        marginTop: 8, background: "#0f62fe", color: "white", borderRadius: 6,
                        padding: "8px 16px", fontSize: 13, textDecoration: "none",
                      }}>
                        Open Workbench
                      </Link>
                    </div>
                  ) : (
                    <div style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={usageByModelDay as any[]}>
                          <CartesianGrid stroke="#f4f7fb" />
                          <XAxis dataKey="day" stroke="#525252" tick={{ fontSize: 11 }} />
                          <YAxis stroke="#525252" tick={{ fontSize: 11 }} />
                          <ChartTooltip content={<CustomChartTooltip />} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                          {modelKeys.map((k, i) => (
                            <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i % CHART_COLORS.length]} name={k} dot={false} strokeWidth={2} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                {/* Prompt Types */}
                <Card>
                  <SectionHeader title="Prompt Types in BigQuery" badge={promptTypes.length} />
                  {promptTypes.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#8d8d8d" }}>No prompt types found in prism_prompt_types table.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {Object.entries(promptsByCategory).map(([cat, items]) => {
                        const style = CAT_STYLE[cat] ?? { bg: "#f4f7fb", color: "#525252" };
                        return (
                          <div key={cat}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#525252", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>
                              {cat}
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {(items as any[]).map((pt: any) => (
                                <span
                                  key={pt.prompt_type_id ?? pt.promptTypeId ?? pt.name}
                                  style={{
                                    background: style.bg, color: style.color,
                                    borderRadius: 20, fontSize: 11, fontWeight: 500,
                                    padding: "3px 10px", border: `1px solid ${style.color}33`,
                                  }}
                                >
                                  {pt.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              {/* Right column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Plans */}
                <Card>
                  <SectionHeader
                    title="Plans Management"
                    badge={plans.length}
                    right={
                      <button onClick={handleCopySeed} style={{
                        background: "white", color: "#0f62fe", border: "1px solid #0f62fe",
                        borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? "Copied!" : "Add Plan SQL"}
                      </button>
                    }
                  />
                  {plans.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#8d8d8d" }}>No plans found. Click "Add Plan SQL" to copy seed SQL.</p>
                  ) : (
                    <>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              {["Tier", "Plan", "$/mo", "$/yr", "vs Competitor", "Tokens", "Models", "Users", "Status"].map((h) => (
                                <Th key={h}>{h}</Th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {plans.map((p: any, i: number) => {
                              const id       = String(p.planId ?? p.plan_id ?? p.id ?? i);
                              const name     = String(p.planName ?? p.plan_name ?? p.plan ?? p.planId ?? "-");
                              const monthly  = Number(p.monthlyPriceUsd ?? p.monthly_price_usd ?? p.price_per_month ?? 0);
                              const yearly   = Number(p.yearlyPriceUsd  ?? p.yearly_price_usd  ?? p.price_per_year  ?? 0);
                              const tokens   = Number(p.monthlyTokenLimit ?? p.monthly_token_limit ?? p.tokenLimit ?? 0);
                              const maxU     = Number(p.maxUsers ?? p.max_users ?? 0);
                              const isActive = p.isActive ?? p.is_active ?? p.active ?? p.status;
                              const models   = parseModels(p.allowedModels ?? p.allowed_models);
                              const tier     = tierMeta(id);
                              const vs       = vsCompetitor(id);
                              return (
                                <tr key={i} style={{ borderLeft: `3px solid ${tier.color}` }}>
                                  <Td>
                                    <span style={{
                                      display: "inline-block", width: 10, height: 10,
                                      borderRadius: "50%", background: tier.dot, marginRight: 4,
                                    }} />
                                  </Td>
                                  <Td>
                                    <span style={{ fontWeight: 500 }}>{name}</span>
                                    {tier.popular && (
                                      <span style={{ marginLeft: 4, fontSize: 10, color: "#0f62fe" }}>★</span>
                                    )}
                                  </Td>
                                  <Td>{monthly > 0 ? `$${monthly}` : "Free"}</Td>
                                  <Td>{yearly  > 0 ? `$${yearly}`  : "Free"}</Td>
                                  <Td style={{ fontSize: 11, color: "#525252", maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={vs}>
                                    {vs}
                                  </Td>
                                  <Td>{fmtTokens(tokens)}</Td>
                                  <Td>
                                    <span style={{
                                      background: "#e8f0fe", color: "#0f62fe", borderRadius: 12,
                                      fontSize: 11, padding: "2px 8px", cursor: "help",
                                    }} title={models.join(", ")}>
                                      {models.length} models
                                    </span>
                                  </Td>
                                  <Td>{fmtUsers(maxU)}</Td>
                                  <Td>
                                    <Pill
                                      label={String(isActive) === "true" || isActive === 1 ? "Active" : "Inactive"}
                                      bg={String(isActive) === "true" || isActive === 1 ? "#defbe6" : "#f4f7fb"}
                                      color={String(isActive) === "true" || isActive === 1 ? "#0e6027" : "#525252"}
                                    />
                                  </Td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {/* Market positioning */}
                      <div style={{
                        marginTop: 12, background: "#e8f0fe", border: "1px solid #0f62fe",
                        borderRadius: 6, padding: "12px 14px", fontSize: 12, color: "#0043ce", lineHeight: 1.6,
                      }}>
                        <strong>Market positioning:</strong> PRISM Developer at $9 undercuts GitHub Copilot Pro ($10) while adding multi-model routing.
                        PRISM Team at $15 undercuts Copilot Business ($19) and Windsurf Teams ($20).
                        Our margin at Gemini 2.5 Flash rates (~$0.15/1M tokens): Developer plan covers ~13M tokens of API cost per user per month — well above the 2M limit.
                      </div>
                    </>
                  )}
                </Card>

                {/* Routing Rules */}
                <Card>
                  <SectionHeader title="Active Routing Rules" badge={routing.length} />
                  {routing.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#8d8d8d" }}>No routing rules configured. Run seed-routing.ts script.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            {["Task Type", "Primary Model", "Provider", "Fallback", "Max Tokens"].map((h) => (
                              <Th key={h}>{h}</Th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {routing.map((r: any, i: number) => {
                            const prov = providerBadge(r.provider ?? r.Provider ?? "");
                            return (
                              <tr key={i}>
                                <Td>{r.taskType ?? r.task_type ?? "-"}</Td>
                                <Td style={{ fontSize: 12, fontFamily: "monospace" }}>{r.modelId ?? r.model_id ?? r.primaryModel ?? "-"}</Td>
                                <Td><Pill label={prov.label} bg={prov.bg} color={prov.color} /></Td>
                                <Td style={{ fontSize: 12 }}>{r.fallbackModel ?? r.fallback_model ?? "-"}</Td>
                                <Td>{r.maxTokensPerCall ?? r.max_tokens_per_call ?? "-"}</Td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* Row 3: Persona cards + Top Users */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Persona Workspace */}
              <Card>
                <SectionHeader title="Persona Workspace" badge="8 personas" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                  {PERSONA_META.map(({ name, icon: Icon, tasks }) => (
                    <div
                      key={name}
                      onClick={() => router.push(`/admin/prism/workbench?persona=${encodeURIComponent(name)}`)}
                      style={{
                        background: "white", border: "1px solid #dcdcdc", borderRadius: 10,
                        padding: "16px 20px", cursor: "pointer", transition: "border-color .15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0f62fe")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#dcdcdc")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <Icon size={20} style={{ color: "#0f62fe" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#161616" }}>{name}</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#525252", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>
                        PERSONA
                      </div>
                      <Pill label={tasks} bg="#edf5ff" color="#0f62fe" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top Users */}
              <Card>
                <SectionHeader
                  title="Top Users by Spend"
                  right={<span style={{ fontSize: 12, color: "#525252" }}>Last 30 days</span>}
                />
                {topUsers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    text="No usage recorded yet"
                    sub="User activity will appear here after governed AI calls are made."
                    linkHref="/admin/prism/workbench"
                    linkLabel="Open Workbench"
                  />
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["User", "Task Type", "Calls", "Tokens", "Spend (USD)", "Blocked", "Actions"].map((h) => (
                            <Th key={h}>{h}</Th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {topUsers.map((u: any, i: number) => {
                          const userId = String(u.userId ?? u.user_id ?? i);
                          const blocked = Number(u.blocked ?? 0);
                          const expanded = expandedUsers.has(userId);
                          return (
                            <Fragment key={userId}>
                              <tr>
                                <Td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{userId}</span></Td>
                                <Td>{u.taskType ?? u.task_type ?? "-"}</Td>
                                <Td>{Number(u.calls ?? 0)}</Td>
                                <Td>{Number(u.tokens ?? 0).toLocaleString()}</Td>
                                <Td>{fmtUsd(Number(u.spend ?? 0))}</Td>
                                <Td>
                                  {blocked > 0
                                    ? <Pill label={String(blocked)} bg="#fff1f1" color="#a2191f" />
                                    : <span style={{ color: "#8d8d8d" }}>-</span>}
                                </Td>
                                <Td>
                                  <button
                                    onClick={() => toggleUserDetails(userId)}
                                    style={{
                                      background: "white", color: "#0f62fe", border: "1px solid #0f62fe",
                                      borderRadius: 4, padding: "4px 10px", fontSize: 12, cursor: "pointer",
                                    }}
                                  >
                                    {expanded ? "Hide" : "View Details"}
                                  </button>
                                </Td>
                              </tr>
                              {expanded && (
                                <tr>
                                  <td colSpan={7} style={{ background: "#f4f7fb", padding: "12px 16px" }}>
                                    <pre style={{ fontSize: 11, color: "#525252", whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 300, overflow: "auto", margin: 0 }}>
                                      {JSON.stringify(userDetailsMap[userId] ?? "Loading…", null, 2)}
                                    </pre>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            {/* Row 4: Budget Policies */}
            <Card>
              <SectionHeader title="OSSA Budget Policies" badge={budgets.length} />
              {budgets.length === 0 ? (
                <div style={{
                  background: "#edf5ff", border: "1px solid #4589ff", borderRadius: 6,
                  padding: "14px 16px", fontSize: 13, color: "#0043ce",
                }}>
                  No budget policies configured. Insert rows into <code>ctoteam.prism.prism_budgets</code>.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Budget ID", "Org", "User", "Daily Token Limit", "Monthly Token Limit", "Daily Spend Cap", "Monthly Spend Cap", "Hard Stop", "Alert Threshold"].map((h) => (
                          <Th key={h}>{h}</Th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {budgets.map((b: any, i: number) => {
                        const hardStop = b.hardStop ?? b.hard_stop ?? b.hardstop;
                        return (
                          <tr key={i}>
                            <Td style={{ fontFamily: "monospace", fontSize: 11 }}>{b.budgetId ?? b.budget_id ?? b.id ?? "-"}</Td>
                            <Td>{b.orgId ?? b.org_id ?? b.org ?? "-"}</Td>
                            <Td style={{ fontFamily: "monospace", fontSize: 11 }}>{b.userId ?? b.user_id ?? b.user ?? "-"}</Td>
                            <Td>{b.dailyTokenLimit ?? b.daily_token_limit ?? "-"}</Td>
                            <Td>{b.monthlyTokenLimit ?? b.monthly_token_limit ?? "-"}</Td>
                            <Td>{(b.dailySpendCapUsd ?? b.daily_spend_cap_usd) != null ? `$${b.dailySpendCapUsd ?? b.daily_spend_cap_usd}` : "-"}</Td>
                            <Td>{(b.monthlySpendCapUsd ?? b.monthly_spend_cap_usd) != null ? `$${b.monthlySpendCapUsd ?? b.monthly_spend_cap_usd}` : "-"}</Td>
                            <Td>
                              {String(hardStop) === "true" || hardStop === 1
                                ? <Pill label="YES" bg="#fff1f1" color="#a2191f" />
                                : <span style={{ color: "#8d8d8d", fontSize: 12 }}>no</span>}
                            </Td>
                            <Td>{b.alertThreshold ?? b.alert_threshold ?? "-"}</Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

          </div>
        )}
      </main>
    </div>
  );
}
