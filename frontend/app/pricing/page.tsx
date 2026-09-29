"use client";
import React, { useState } from "react";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import {
  Check, Minus, GraduationCap, Bot, GitFork, ChevronDown, ChevronUp, X,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Feature { text: string; included: boolean; note?: string }

interface PlanDef {
  id: string;
  name: string;
  badgeLabel: string;
  monthly: number;
  yearly: number;
  maxUsers: number;
  tokens: number;
  color: string;
  badgeBg: string;
  badgeColor: string;
  description: string;
  vsNote?: string;
  features: Feature[];
  ctaLabel: string;
  ctaColor: string;
  ctaBg: string;
  ctaOutline?: boolean;
  ctaHref?: string;
  popular?: boolean;
  footerNote?: string;
}

// ── Plan data ─────────────────────────────────────────────────────────────────

const PLANS: PlanDef[] = [
  {
    id: "community",
    name: "Community",
    badgeLabel: "Free Forever",
    monthly: 0,
    yearly: 0,
    maxUsers: 1,
    tokens: 200_000,
    color: "#24a148",
    badgeBg: "#defbe6",
    badgeColor: "#0e6027",
    description: "Developers exploring governed AI",
    features: [
      { text: "200K tokens/month", included: true },
      { text: "Gemini Flash model", included: true },
      { text: "OSSA governance", included: true },
      { text: "Prompt library access (25 techniques)", included: true },
      { text: "BigQuery audit log", included: true },
      { text: "1 user", included: true },
      { text: "GPT-4o / Claude access", included: false },
      { text: "Team features", included: false },
    ],
    ctaLabel: "Start Free — No card needed",
    ctaColor: "white",
    ctaBg: "#24a148",
    footerNote: "Same governance as paid plans. No hidden limits.",
  },
  {
    id: "student",
    name: "Student",
    badgeLabel: "Student Free",
    monthly: 0,
    yearly: 0,
    maxUsers: 1,
    tokens: 500_000,
    color: "#24a148",
    badgeBg: "#defbe6",
    badgeColor: "#0e6027",
    description: "University students and bootcamp learners",
    features: [
      { text: "500K tokens/month", included: true },
      { text: "Gemini Flash + Gemini 2.5 Flash", included: true },
      { text: "OSSA governance", included: true },
      { text: "All 25 prompt techniques", included: true },
      { text: "BigQuery audit log", included: true },
      { text: "1 user", included: true },
    ],
    ctaLabel: "Apply as Student",
    ctaColor: "#24a148",
    ctaBg: "white",
    ctaOutline: true,
    footerNote: "Requires .edu email or institution verification (coming soon)",
  },
  {
    id: "developer",
    name: "Developer",
    badgeLabel: "Developer",
    monthly: 9,
    yearly: 85,
    maxUsers: 1,
    tokens: 2_000_000,
    color: "#0f62fe",
    badgeBg: "#edf5ff",
    badgeColor: "#0043ce",
    description: "Individual developers and AI engineers",
    vsNote: "vs GitHub Copilot Pro $10 — adds Claude + Gemini routing",
    features: [
      { text: "2M tokens/month", included: true },
      { text: "Gemini 2.5 Flash + GPT-4o Mini + Claude Sonnet", included: true },
      { text: "Multi-model routing", included: true },
      { text: "OSSA governance + hard stops", included: true },
      { text: "Persona prompts (Developer, AI Engineer)", included: true },
      { text: "BigQuery audit log", included: true },
      { text: "1 user", included: true },
      { text: "API access", included: true },
    ],
    ctaLabel: "Start Developer Plan",
    ctaColor: "white",
    ctaBg: "#0f62fe",
  },
  {
    id: "team",
    name: "Team",
    badgeLabel: "Most Popular ★",
    monthly: 15,
    yearly: 144,
    maxUsers: 20,
    tokens: 10_000_000,
    color: "#0f62fe",
    badgeBg: "#0f62fe",
    badgeColor: "white",
    description: "Engineering teams of up to 20",
    vsNote: "vs Copilot Business $19 · vs Windsurf Teams $20",
    popular: true,
    features: [
      { text: "10M tokens/month shared pool", included: true },
      { text: "Gemini 2.5 Flash + GPT-4o Mini + Claude Sonnet", included: true },
      { text: "Multi-model routing with fallback", included: true },
      { text: "OSSA team budget policies", included: true },
      { text: "All 8 persona prompt libraries", included: true },
      { text: "BigQuery audit log (team-wide)", included: true },
      { text: "Up to 20 users", included: true },
      { text: "Centralized usage dashboard", included: true },
      { text: "Role-based access (coming soon)", included: true, note: "coming soon" },
    ],
    ctaLabel: "Start Team Trial",
    ctaColor: "white",
    ctaBg: "#0f62fe",
  },
  {
    id: "business",
    name: "Business",
    badgeLabel: "Business",
    monthly: 29,
    yearly: 278,
    maxUsers: 100,
    tokens: 50_000_000,
    color: "#e8a000",
    badgeBg: "#fef6de",
    badgeColor: "#8e5600",
    description: "Growing companies needing all models + compliance",
    vsNote: "vs Cursor Teams $40 · vs Copilot Enterprise $39",
    features: [
      { text: "50M tokens/month shared pool", included: true },
      { text: "ALL models: GPT-4o + Claude Sonnet + Gemini 2.5 Flash", included: true },
      { text: "Advanced model routing rules", included: true },
      { text: "OSSA hard stop + spend alerts", included: true },
      { text: "All personas + custom prompts", included: true },
      { text: "BigQuery audit with export", included: true },
      { text: "Up to 100 users", included: true },
      { text: "SLA support (coming soon)", included: true, note: "coming soon" },
    ],
    ctaLabel: "Start Business Trial",
    ctaColor: "white",
    ctaBg: "#e8a000",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badgeLabel: "Enterprise",
    monthly: 49,
    yearly: 470,
    maxUsers: 999,
    tokens: 999_999_999,
    color: "#002d9c",
    badgeBg: "#edf5ff",
    badgeColor: "#002d9c",
    description: "Large orgs, Mastech Digital clients, regulated industries",
    features: [
      { text: "Unlimited tokens", included: true },
      { text: "ALL models", included: true },
      { text: "Custom OSSA governance rules", included: true },
      { text: "Dedicated BigQuery dataset", included: true },
      { text: "Custom prompt library", included: true },
      { text: "Unlimited users", included: true },
      { text: "SLA + dedicated support", included: true },
      { text: "On-prem BigQuery option", included: true },
      { text: "EU AI Act compliance logging", included: true },
    ],
    ctaLabel: "Contact Sales",
    ctaColor: "white",
    ctaBg: "#002d9c",
    ctaHref: "mailto:prism@mastechdigital.com",
  },
];

// ── Comparison table data ──────────────────────────────────────────────────────

type Cell = { yes: true } | { no: true } | { partial: string } | { text: string };

const YES: Cell = { yes: true };
const NO: Cell  = { no: true };

const COMPARISON: { feature: string; prism: Cell; copilot: Cell; cursor: Cell; claudePro: Cell }[] = [
  { feature: "Multi-model routing (OpenAI+Claude+Gemini)", prism: YES,                     copilot: NO,                        cursor: { partial: "IDE only" }, claudePro: NO },
  { feature: "OSSA spend governance",                      prism: YES,                     copilot: NO,                        cursor: NO,                       claudePro: NO },
  { feature: "BigQuery audit log",                         prism: YES,                     copilot: NO,                        cursor: NO,                       claudePro: NO },
  { feature: "Persona-aware prompt library",               prism: YES,                     copilot: NO,                        cursor: NO,                       claudePro: NO },
  { feature: "25 prompt engineering techniques",           prism: YES,                     copilot: NO,                        cursor: NO,                       claudePro: NO },
  { feature: "Token budget hard stops",                    prism: YES,                     copilot: NO,                        cursor: NO,                       claudePro: NO },
  { feature: "API access",                                 prism: YES,                     copilot: YES,                       cursor: YES,                      claudePro: YES },
  { feature: "Works with any IDE",                         prism: YES,                     copilot: YES,                       cursor: { partial: "own IDE" },   claudePro: YES },
  { feature: "Free tier",                                  prism: { text: "200K tokens" }, copilot: { text: "2K completions" }, cursor: NO,                       claudePro: { text: "limited" } },
  { feature: "Student free plan",                          prism: { text: "500K tokens" }, copilot: { text: "GitHub pack" },   cursor: NO,                       claudePro: NO },
  { feature: "Team spend dashboard",                       prism: YES,                     copilot: NO,                        cursor: NO,                       claudePro: NO },
  { feature: "EU AI Act audit logging",                    prism: YES,                     copilot: NO,                        cursor: NO,                       claudePro: NO },
];

// ── FAQs ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "What happens when I hit my token limit?",
    a: "OSSA governance automatically stops API calls and notifies you. You can upgrade your plan or wait for the next billing cycle.",
  },
  {
    q: "Can I switch plans mid-month?",
    a: "Yes. Upgrades take effect immediately. Downgrades apply at the next billing cycle.",
  },
  {
    q: "Which AI models are included in each plan?",
    a: "Community/Student: Gemini Flash. Developer/Team: adds Claude Sonnet and GPT-4o Mini. Business/Enterprise: all models including GPT-4o and Claude Sonnet.",
  },
  {
    q: "How does PRISM differ from GitHub Copilot?",
    a: "Copilot focuses on IDE code completion with one model at a time. PRISM is a governance platform: it routes across OpenAI, Claude, and Gemini with OSSA spend controls, BigQuery audit logging, and a persona-aware prompt library. They can complement each other.",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTokens(v: number) {
  if (v >= 999_000_000) return "Unlimited";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function fmtUsers(v: number) {
  if (v >= 999) return "Unlimited users";
  if (v === 1) return "1 user";
  return `Up to ${v} users`;
}

function CellIcon({ cell }: { cell: Cell }) {
  if ("yes" in cell) return <Check size={16} style={{ color: "#24a148" }} />;
  if ("no"  in cell) return <Minus size={16} style={{ color: "#c6c6c6" }} />;
  if ("partial" in cell)
    return (
      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Check size={14} style={{ color: "#24a148" }} />
        <span style={{ fontSize: 11, color: "#525252" }}>({cell.partial})</span>
      </span>
    );
  return <span style={{ fontSize: 12, color: "#525252" }}>{cell.text}</span>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [mode, setMode]       = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', Inter, sans-serif", background: "#f8faff", minHeight: "100vh" }}>
      <TopNav />

      <main style={{ paddingTop: 72, paddingBottom: 64 }}>

        {/* ── Hero ── */}
        <div style={{ background: "white", borderBottom: "1px solid #dcdcdc", padding: "48px 24px", textAlign: "center" }}>
          <span style={{
            display: "inline-block", background: "#edf5ff", color: "#0043ce",
            borderRadius: 20, fontSize: 12, fontWeight: 500, padding: "4px 14px", marginBottom: 16,
          }}>
            PRISM Pricing — Transparent &amp; Governed
          </span>
          <h1 style={{ fontSize: 36, fontWeight: 600, color: "#161616", margin: "0 0 12px" }}>
            The only AI platform with built-in governance
          </h1>
          <p style={{ fontSize: 16, color: "#525252", margin: "0 0 28px", maxWidth: 560, marginInline: "auto" }}>
            One subscription. Three AI providers. OSSA spend control. BigQuery audit trail.
          </p>

          {/* Toggle */}
          <div style={{ display: "inline-flex", background: "#f4f7fb", border: "1px solid #dcdcdc", borderRadius: 8, padding: 4, gap: 4 }}>
            <button
              onClick={() => setMode("monthly")}
              style={{
                padding: "8px 22px", borderRadius: 6, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
                background: mode === "monthly" ? "white" : "transparent",
                color: mode === "monthly" ? "#0f62fe" : "#525252",
                boxShadow: mode === "monthly" ? "0 1px 3px rgba(0,0,0,.12)" : "none",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setMode("yearly")}
              style={{
                padding: "8px 22px", borderRadius: 6, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer",
                background: mode === "yearly" ? "white" : "transparent",
                color: mode === "yearly" ? "#0f62fe" : "#525252",
                boxShadow: mode === "yearly" ? "0 1px 3px rgba(0,0,0,.12)" : "none",
              }}
            >
              Yearly — Save 2 months
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>

          {/* ── Competitor context banner ── */}
          <div style={{
            marginTop: 32, background: "#e8f0fe", border: "1px solid #0f62fe",
            borderRadius: 8, padding: "16px 24px", fontSize: 13, color: "#0043ce", lineHeight: 1.6,
          }}>
            <strong>How PRISM compares:</strong> GitHub Copilot Pro ($10) routes to one model. Cursor Pro ($20) is IDE-only.
            PRISM ($9+) routes across OpenAI, Claude, and Gemini — with persona prompts, OSSA governance, and full audit logging.
          </div>

          {/* ── Plan cards ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
            marginTop: 32,
          }}>
            {PLANS.map((plan) => {
              const price   = mode === "monthly" ? plan.monthly : plan.yearly;
              const savings = plan.monthly * 12 - plan.yearly;

              return (
                <div
                  key={plan.id}
                  style={{
                    background: "white",
                    border: plan.popular ? `2px solid ${plan.color}` : "1px solid #dcdcdc",
                    borderRadius: 12,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Popular banner */}
                  {plan.popular && (
                    <div style={{
                      background: plan.color, color: "white", textAlign: "center",
                      fontSize: 12, fontWeight: 600, padding: "8px 0", letterSpacing: ".02em",
                    }}>
                      Most Popular ★
                    </div>
                  )}

                  <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Badge */}
                    <span style={{
                      display: "inline-block", background: plan.badgeBg, color: plan.badgeColor,
                      borderRadius: 20, fontSize: 11, fontWeight: 600, padding: "3px 12px",
                      textTransform: "uppercase" as const, letterSpacing: ".04em", marginBottom: 14,
                    }}>
                      {plan.badgeLabel}
                    </span>

                    {/* Price */}
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 44, fontWeight: 700, color: "#161616", lineHeight: 1 }}>
                        {price === 0 ? "Free" : `$${price}`}
                      </span>
                      {price > 0 && (
                        <span style={{ fontSize: 14, color: "#525252", marginLeft: 4 }}>
                          /{mode === "monthly" ? "month" : "year"}
                          {plan.maxUsers > 1 ? "/user" : ""}
                        </span>
                      )}
                    </div>

                    {/* Savings */}
                    {mode === "yearly" && savings > 0 && (
                      <p style={{ fontSize: 12, color: "#24a148", fontWeight: 500, margin: "4px 0 0" }}>
                        Save ${savings}/user/year
                      </p>
                    )}

                    {/* Description */}
                    <p style={{ fontSize: 13, color: "#525252", margin: "10px 0" }}>{plan.description}</p>

                    {/* vs Competitor note */}
                    {plan.vsNote && (
                      <p style={{
                        fontSize: 11, color: "#525252", margin: "0 0 10px",
                        background: "#f4f7fb", borderRadius: 4, padding: "4px 8px",
                      }}>
                        {plan.vsNote}
                      </p>
                    )}

                    <hr style={{ border: "none", borderTop: "1px solid #dcdcdc", margin: "10px 0 14px" }} />

                    {/* Features */}
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
                      {plan.features.map((feat) => (
                        <li key={feat.text} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
                          {feat.included
                            ? <Check size={14} style={{ color: "#0f62fe", flexShrink: 0, marginTop: 2 }} />
                            : <X     size={14} style={{ color: "#c6c6c6", flexShrink: 0, marginTop: 2 }} />}
                          <span style={{ color: feat.included ? "#161616" : "#8d8d8d" }}>
                            {feat.text}
                            {feat.note && (
                              <span style={{ fontSize: 10, color: "#8d8d8d", marginLeft: 4, fontStyle: "italic" }}>
                                ({feat.note})
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Footer note */}
                    {plan.footerNote && (
                      <p style={{
                        fontSize: 11, color: plan.id === "community" ? "#0e6027" : "#525252",
                        background: plan.id === "community" ? "#defbe6" : "#f4f7fb",
                        borderRadius: 6, padding: "8px 10px", margin: "0 0 14px",
                      }}>
                        {plan.footerNote}
                      </p>
                    )}

                    {/* CTA */}
                    {plan.ctaHref ? (
                      <a
                        href={plan.ctaHref}
                        style={{
                          display: "block", width: "100%", padding: "11px 0", borderRadius: 6,
                          fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "center",
                          textDecoration: "none",
                          background: plan.ctaOutline ? "white" : plan.ctaBg,
                          color: plan.ctaColor,
                          border: plan.ctaOutline ? `1.5px solid ${plan.ctaBg}` : "none",
                          boxSizing: "border-box" as const,
                        }}
                      >
                        {plan.ctaLabel}
                      </a>
                    ) : (
                      <button
                        style={{
                          width: "100%", padding: "11px 0", borderRadius: 6,
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                          background: plan.ctaOutline ? "white" : plan.ctaBg,
                          color: plan.ctaColor,
                          border: plan.ctaOutline ? `1.5px solid ${plan.ctaBg}` : "none",
                        }}
                      >
                        {plan.ctaLabel}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* All plans include */}
          <p style={{ textAlign: "center", color: "#525252", fontSize: 13, marginTop: 28 }}>
            All plans include: OSSA governance · BigQuery audit logging · Multi-model routing · Prompt Library access · API access
          </p>

          {/* ── Competitor comparison table ── */}
          <section style={{ marginTop: 64 }}>
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <h2 style={{ fontSize: 28, fontWeight: 600, color: "#161616", margin: "0 0 8px" }}>
                How PRISM compares
              </h2>
              <p style={{ fontSize: 14, color: "#525252", margin: 0 }}>
                We&apos;re not an IDE. We&apos;re the governance layer above your AI tools.
              </p>
            </div>

            <div style={{
              marginTop: 24, background: "white", border: "1px solid #dcdcdc",
              borderRadius: 10, overflow: "hidden",
            }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={{
                        textAlign: "left", padding: "12px 16px", fontSize: 11, textTransform: "uppercase",
                        letterSpacing: ".04em", color: "#525252", background: "#f4f7fb",
                        borderBottom: "1px solid #dcdcdc", fontWeight: 600,
                      }}>
                        Feature
                      </th>
                      {/* PRISM column — highlighted */}
                      <th style={{
                        textAlign: "center", padding: "12px 16px", fontSize: 12, fontWeight: 700,
                        background: "#0f62fe", color: "white", borderBottom: "1px solid #0043ce",
                      }}>
                        PRISM Developer<br />
                        <span style={{ fontSize: 11, fontWeight: 400, opacity: .85 }}>$9/mo</span>
                      </th>
                      {[
                        { label: "GitHub Copilot Pro", price: "$10/mo" },
                        { label: "Cursor Pro",          price: "$20/mo" },
                        { label: "Claude Pro",          price: "$20/mo" },
                      ].map(({ label, price }) => (
                        <th key={label} style={{
                          textAlign: "center", padding: "12px 16px", fontSize: 11, fontWeight: 600,
                          color: "#525252", background: "#f4f7fb", borderBottom: "1px solid #dcdcdc",
                          textTransform: "uppercase" as const, letterSpacing: ".04em",
                        }}>
                          {label}<br />
                          <span style={{ fontWeight: 400 }}>{price}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON.map((row, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #f4f7fb" }}>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: "#161616" }}>{row.feature}</td>
                        <td style={{ padding: "11px 16px", textAlign: "center", background: "#f0f6ff" }}>
                          <CellIcon cell={row.prism} />
                        </td>
                        <td style={{ padding: "11px 16px", textAlign: "center" }}><CellIcon cell={row.copilot} /></td>
                        <td style={{ padding: "11px 16px", textAlign: "center" }}><CellIcon cell={row.cursor} /></td>
                        <td style={{ padding: "11px 16px", textAlign: "center" }}><CellIcon cell={row.claudePro} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: 11, color: "#8d8d8d", padding: "10px 16px", margin: 0, borderTop: "1px solid #f4f7fb" }}>
                Competitor features based on publicly available information as of May 2026.
                Cursor supports multi-model within its own IDE only.
                GitHub Copilot Free tier applies to completions, not governed API routing.
              </p>
            </div>
          </section>

          {/* ── Developer community section ── */}
          <section style={{ marginTop: 64 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h2 style={{ fontSize: 28, fontWeight: 600, color: "#161616", margin: "0 0 10px" }}>
                Built for the developer community
              </h2>
              <p style={{ fontSize: 14, color: "#525252", maxWidth: 560, margin: "0 auto" }}>
                PRISM is free for individual developers, students, and open source contributors.
                No credit card. No time limit. Just governed AI.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {/* Open Source */}
              <div style={{ background: "white", border: "1px solid #dcdcdc", borderRadius: 10, padding: "24px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <GitFork size={28} style={{ color: "#0f62fe" }} />
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#161616" }}>Open Source</span>
                </div>
                <p style={{ fontSize: 13, color: "#525252", margin: "0 0 14px", lineHeight: 1.6 }}>
                  Using PRISM for open source projects? Community plan is free forever.
                  Fork it, extend it, contribute back.
                </p>
                <a href="#" style={{ fontSize: 13, color: "#0f62fe", textDecoration: "none", fontWeight: 500 }}>
                  View on GitHub →
                </a>
              </div>

              {/* Students */}
              <div style={{ background: "white", border: "1px solid #dcdcdc", borderRadius: 10, padding: "24px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <GraduationCap size={28} style={{ color: "#0f62fe" }} />
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#161616" }}>Students &amp; Bootcamps</span>
                </div>
                <p style={{ fontSize: 13, color: "#525252", margin: "0 0 14px", lineHeight: 1.6 }}>
                  500K free tokens/month. All 25 prompt techniques.
                  Learn Chain-of-Thought, RAG, and Tree-of-Thoughts with real models.
                </p>
                <a href="#" style={{ fontSize: 13, color: "#0f62fe", textDecoration: "none", fontWeight: 500 }}>
                  Apply for Student Plan →
                </a>
              </div>

              {/* AI Engineers */}
              <div style={{ background: "white", border: "1px solid #dcdcdc", borderRadius: 10, padding: "24px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Bot size={28} style={{ color: "#0f62fe" }} />
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#161616" }}>AI Engineers</span>
                </div>
                <p style={{ fontSize: 13, color: "#525252", margin: "0 0 14px", lineHeight: 1.6 }}>
                  PRISM is the only platform that lets you compare Chain-of-Code vs
                  Structured Chain-of-Thought across GPT-4o, Claude, and Gemini — governed.
                </p>
                <a href="#" style={{ fontSize: 13, color: "#0f62fe", textDecoration: "none", fontWeight: 500 }}>
                  Start Developer Plan →
                </a>
              </div>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section style={{ marginTop: 64 }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: "#161616", marginBottom: 24, textAlign: "center" }}>
              Frequently Asked Questions
            </h2>
            <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {FAQS.map((faq, i) => (
                <div key={i} style={{ background: "white", border: "1px solid #dcdcdc", borderRadius: 8, overflow: "hidden" }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "16px 20px", background: "none", border: "none", cursor: "pointer",
                      textAlign: "left" as const, fontSize: 14, fontWeight: 500, color: "#161616",
                    }}
                  >
                    {faq.q}
                    {openFaq === i
                      ? <ChevronUp   size={16} style={{ color: "#525252", flexShrink: 0 }} />
                      : <ChevronDown size={16} style={{ color: "#525252", flexShrink: 0 }} />}
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: "0 20px 16px", fontSize: 13, color: "#525252", lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
