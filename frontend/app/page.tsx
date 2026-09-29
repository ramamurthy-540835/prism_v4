import Link from "next/link";
import { Shield, GitBranch, BookOpen, Code2, Building2, FlaskConical, CheckSquare, BarChart, Brain, GraduationCap, BookMarked } from "lucide-react";
import TopNav from "@/components/TopNav";

const PERSONAS = [
  { name: "Developer",         icon: Code2,         slug: "Developer" },
  { name: "Architect",         icon: Building2,      slug: "Architect" },
  { name: "Tester",            icon: FlaskConical,   slug: "Tester" },
  { name: "QA",                icon: CheckSquare,    slug: "QA" },
  { name: "Business Analyst",  icon: BarChart,       slug: "BusinessAnalyst" },
  { name: "AI Engineer",       icon: Brain,          slug: "AIEngineer" },
  { name: "Mentor",            icon: GraduationCap,  slug: "Mentor" },
  { name: "Student",           icon: BookMarked,     slug: "Student" },
];

const CAPABILITIES = [
  {
    icon: Shield,
    title: "OSSA Governance",
    body: "Token budgets, spend limits, allow/warn/stop decisions logged to BigQuery in real time.",
  },
  {
    icon: GitBranch,
    title: "Multi-Model Routing",
    body: "Route intelligently across OpenAI GPT-4o, Anthropic Claude, and Google Gemini based on task type and plan.",
  },
  {
    icon: BookOpen,
    title: "Governed Prompt Library",
    body: "25 prompt engineering techniques — Chain-of-Thought, RAG, ReAct, Tree-of-Thoughts — version-controlled and BigQuery-backed.",
  },
];

const STATS = [
  { value: "3", label: "AI Providers" },
  { value: "25", label: "Prompt Types" },
  { value: "8", label: "Personas" },
  { value: "OSSA", label: "Governed" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8faff]" style={{ fontFamily: "'IBM Plex Sans', Inter, sans-serif" }}>
      <TopNav />

      {/* Spacer for fixed TopNav */}
      <div style={{ height: 56 }} />

      {/* ── Section 1: Hero ── */}
      <section className="border-b border-[#dcdcdc] bg-white">
        <div className="mx-auto max-w-7xl px-8 py-12">
          <div className="flex flex-col lg:flex-row items-start gap-12">

            {/* Left: copy + buttons */}
            <div className="flex-1 space-y-5">
              <span className="inline-block rounded-full border border-[#4589ff] bg-[#edf5ff] px-3 py-1 text-xs font-medium text-[#0f62fe]">
                Mastech Digital · Enterprise AI
              </span>
              <h1 className="text-[36px] font-semibold leading-tight text-[#161616]">
                PRISM — Governed Multi-Model<br />AI Engineering Platform
              </h1>
              <p className="text-[16px] text-[#525252]">
                Prompt · Role · Intelligence · Spend · Management
              </p>
              <p className="text-[15px] text-[#525252] leading-relaxed max-w-xl">
                Route prompts across OpenAI, Claude, and Gemini with OSSA governance, token budgets, and full audit visibility.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/admin/prism"
                  className="inline-block rounded px-5 py-2.5 text-sm font-semibold text-white"
                  style={{ background: "#0f62fe" }}>
                  Open Admin Dashboard
                </Link>
                <Link href="/admin/prism/workbench"
                  className="inline-block rounded border border-[#0f62fe] bg-white px-5 py-2.5 text-sm font-semibold text-[#0f62fe]">
                  Open Workbench
                </Link>
                <Link href="/test-call"
                  className="inline-block rounded border border-[#dcdcdc] bg-white px-5 py-2.5 text-sm font-semibold text-[#525252]">
                  Test Governed AI Call
                </Link>
              </div>
            </div>

            {/* Right: stats grid */}
            <div className="grid grid-cols-2 gap-4 lg:w-72 w-full">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-[10px] border border-[#dcdcdc] bg-white shadow-sm overflow-hidden">
                  <div className="h-1 bg-[#0f62fe]" />
                  <div className="p-4">
                    <div className="text-[28px] font-bold text-[#0f62fe] leading-none">{s.value}</div>
                    <div className="mt-1 text-[12px] uppercase tracking-wide text-[#525252]">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Persona Workspace ── */}
      <section className="border-b border-[#dcdcdc] bg-[#f4f7fb]">
        <div className="mx-auto max-w-7xl px-8 py-12">
          <h2 className="text-[20px] font-semibold text-[#161616]">Persona Workspace</h2>
          <p className="mt-1 text-[14px] text-[#525252] max-w-2xl">
            Select a persona to open the governed workbench with role-specific prompts and model routing.
          </p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PERSONAS.map(({ name, icon: Icon, slug }) => (
              <Link
                key={slug}
                href={`/admin/prism/workbench?persona=${slug}`}
                className="group block rounded-[10px] border border-[#dcdcdc] bg-white overflow-hidden transition-all hover:border-[#0f62fe] hover:shadow-[0_2px_8px_rgba(15,98,254,0.12)]"
              >
                <div className="h-1 bg-[#0f62fe]" />
                <div className="p-4">
                  <div className="text-[11px] uppercase tracking-widest text-[#525252] font-medium">Persona</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Icon size={18} className="text-[#0f62fe] shrink-0" />
                    <span className="text-[18px] font-semibold text-[#161616] leading-tight">{name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Platform Capabilities ── */}
      <section className="border-b border-[#dcdcdc] bg-white">
        <div className="mx-auto max-w-7xl px-8 py-12">
          <h2 className="text-[20px] font-semibold text-[#161616]">Platform Capabilities</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {CAPABILITIES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[10px] border border-[#dcdcdc] bg-white p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf5ff]">
                  <Icon size={20} className="text-[#0f62fe]" />
                </div>
                <h3 className="text-[16px] font-semibold text-[#161616]">{title}</h3>
                <p className="mt-2 text-[14px] text-[#525252] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Future State banner ── */}
      <section className="bg-[#f4f7fb] border-t border-[#dcdcdc]">
        <div className="mx-auto max-w-7xl px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold text-[#161616]">User Authentication &amp; Profile Management</p>
            <p className="mt-0.5 text-[13px] text-[#525252]">
              Login, registration, email verification, and role-based access control are planned for the next release.
            </p>
          </div>
          <Link href="/login">
            <span className="inline-block rounded-full bg-[#0f62fe] px-4 py-1.5 text-sm font-medium text-white whitespace-nowrap">
              Coming Soon
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
