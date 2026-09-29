/* global React */
const { TOK, PLEX, MONO, Icon, Pill, Dot, Wordmark } = window;

// ─── shared bottom branding ──────────────────────────────────
const Footer = ({ idx, total = 5, dark = false }) => (
  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "0 48px 36px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", color: dark ? TOK.white : TOK.ink, fontFamily: PLEX }}>
    <div style={{ fontSize: 14, fontWeight: 500 }}>
      PRISM <span style={{ opacity: 0.55 }}>by Mastech Digital</span>
    </div>
    <div style={{ fontFamily: MONO, fontSize: 12, opacity: 0.7 }}>{idx}/{total}</div>
  </div>
);

// ─── C1 — Hook ───────────────────────────────────────────────
function C1() {
  return (
    <div style={{ width: 1080, height: 1080, background: TOK.ink, color: TOK.white, fontFamily: PLEX, position: "relative", overflow: "hidden" }}>
      {/* faint grid */}
      <svg width="1080" height="1080" style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
        <defs><pattern id="c1g" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="#fff" strokeWidth="0.5" /></pattern></defs>
        <rect width="1080" height="1080" fill="url(#c1g)" />
      </svg>

      <div style={{ position: "absolute", top: 60, left: 60, fontFamily: MONO, fontSize: 11, letterSpacing: 2.4, textTransform: "uppercase", opacity: 0.55 }}>
        The state of enterprise AI · 2026
      </div>

      <div style={{ position: "absolute", top: "50%", left: 60, right: 60, transform: "translateY(-55%)" }}>
        <div style={{ fontSize: 86, fontWeight: 600, letterSpacing: -2.5, lineHeight: 1.02 }}>
          Your team is using<br/>
          <span style={{ color: "#9ca3af" }}>3 different AI tools</span><br/>
          with <span style={{ position: "relative", display: "inline-block" }}>
            zero governance
            <span style={{ position: "absolute", left: 0, right: 0, bottom: 8, height: 4, background: TOK.rose }} />
          </span>.
        </div>
        <div style={{ marginTop: 56, fontSize: 44, fontWeight: 500, color: TOK.blueLite, letterSpacing: -0.6 }}>
          There is a better way<span style={{ color: TOK.blue }}>.</span>
        </div>
      </div>

      <Footer idx={1} dark />
    </div>
  );
}

// ─── C2 — Problem ────────────────────────────────────────────
function C2() {
  // chaotic scattered provider tags + warnings
  const chips = [
    { x: 60, y: 30,  rot: -8,  label: "GPT-4o",         tone: "amber" },
    { x: 280, y: 140, rot: 12, label: "Claude 3.5",      tone: "amber" },
    { x: 60, y: 240, rot: 6,   label: "Gemini Pro",      tone: "amber" },
    { x: 240, y: 320, rot: -14, label: "Personal API key", tone: "rose" },
    { x: 30, y: 410, rot: 4,   label: "Random prompts",  tone: "rose" },
    { x: 260, y: 470, rot: -6, label: "$ ?",             tone: "rose" },
  ];
  const warnings = [
    "No audit trail",
    "Budget overruns",
    "Inconsistent prompts",
  ];

  return (
    <div style={{ width: 1080, height: 1080, background: TOK.white, color: TOK.ink, fontFamily: PLEX, position: "relative", overflow: "hidden" }}>
      {/* LEFT chaos region */}
      <div style={{ position: "absolute", left: 60, top: 120, width: 460, height: 580, background: "#fef2f2", border: `1px dashed ${TOK.rose}` }}>
        <div style={{ position: "absolute", top: 14, left: 16, fontFamily: MONO, fontSize: 10, letterSpacing: 1.6, textTransform: "uppercase", color: TOK.rose }}>
          ⚠ Ungoverned
        </div>
        {chips.map(c => (
          <div key={c.label} style={{
            position: "absolute", left: c.x, top: c.y,
            transform: `rotate(${c.rot}deg)`,
            background: TOK.white,
            border: `1px solid ${c.tone === "rose" ? TOK.rose : TOK.amber}`,
            padding: "8px 14px", fontFamily: MONO, fontSize: 13,
            color: c.tone === "rose" ? TOK.rose : TOK.amber, fontWeight: 500
          }}>{c.label}</div>
        ))}
        {/* tangled lines */}
        <svg width="460" height="580" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <g stroke="#fca5a5" strokeWidth="1" fill="none" opacity="0.7">
            <path d="M120 70 Q 240 200 320 170" />
            <path d="M340 180 Q 200 280 100 270" />
            <path d="M120 280 Q 240 380 300 350" />
            <path d="M120 440 Q 220 420 300 500" />
            <path d="M340 200 Q 380 360 320 480" />
          </g>
        </svg>
      </div>

      {/* RIGHT — heading + warnings */}
      <div style={{ position: "absolute", right: 60, top: 120, width: 460 }}>
        <Pill bg="#fee2e2" color={TOK.rose} size={11}>
          <Dot s={6} c={TOK.rose} /> THE PROBLEM
        </Pill>
        <h2 style={{ margin: "20px 0 0", fontSize: 60, fontWeight: 600, letterSpacing: -1.6, lineHeight: 1.02, color: TOK.ink }}>
          The problem with <span style={{ color: TOK.rose }}>ungoverned AI</span>
        </h2>
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
          {warnings.map(w => (
            <div key={w} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: TOK.bgSoft, border: `1px solid ${TOK.line}` }}>
              <div style={{ width: 8, height: 8, background: TOK.rose, borderRadius: "50%" }} />
              <div style={{ fontSize: 20, fontWeight: 500, color: TOK.ink }}>{w}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28, fontFamily: MONO, fontSize: 12, color: TOK.muted, lineHeight: 1.6 }}>
          → Multiple bills, multiple providers,<br/>
          &nbsp;&nbsp;zero visibility into spend or risk.
        </div>
      </div>

      <Footer idx={2} />
    </div>
  );
}

// ─── C3 — Solution ───────────────────────────────────────────
function C3() {
  const Box = ({ x, y, w = 220, h = 56, label, sub, primary }) => (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={primary ? TOK.blue : TOK.white} stroke={primary ? TOK.blue : TOK.line} strokeWidth="1" />
      <text x={x + 16} y={y + 24} fontFamily={PLEX} fontSize="15" fontWeight="600" fill={primary ? TOK.white : TOK.ink}>{label}</text>
      {sub && <text x={x + 16} y={y + 42} fontFamily={MONO} fontSize="11" fill={primary ? "rgba(255,255,255,0.7)" : TOK.muted}>{sub}</text>}
    </g>
  );
  return (
    <div style={{ width: 1080, height: 1080, background: TOK.white, color: TOK.ink, fontFamily: PLEX, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: TOK.blue }} />

      <div style={{ padding: "80px 60px 0 80px" }}>
        <Pill bg={TOK.blueBg} color={TOK.blue} size={11}><Dot s={6} /> THE SOLUTION</Pill>
        <h2 style={{ margin: "20px 0 0", fontSize: 64, fontWeight: 600, letterSpacing: -1.6, lineHeight: 1.02 }}>
          PRISM governs<br/>every call.
        </h2>
      </div>

      {/* architecture diagram */}
      <svg viewBox="0 0 920 560" width="920" height="560" style={{ display: "block", margin: "44px auto 0" }}>
        {/* connectors */}
        <g stroke={TOK.line} strokeWidth="1.5" fill="none">
          <path d="M180 60 L300 60 L300 270 L380 270" />
          <path d="M620 270 L720 90"  />
          <path d="M620 270 L720 270" />
          <path d="M620 270 L720 450" />
          <path d="M820 90 L880 90 L880 540 L500 540 L500 326" />
          <path d="M820 270 L880 270" />
          <path d="M820 450 L880 450 L880 540" />
        </g>
        {/* arrowheads */}
        <g fill={TOK.muted}>
          <polygon points="378,266 388,270 378,274" />
          <polygon points="718,86 728,90 718,94" />
          <polygon points="718,266 728,270 718,274" />
          <polygon points="718,446 728,450 718,454" />
          <polygon points="498,330 502,322 506,330" />
        </g>

        <Box x={20} y={32} label="Your Team" sub="Devs · Analysts · QA" />
        <Box x={380} y={242} w={240} primary label="PRISM Router" sub="OSSA + Token Budgets" />

        <Box x={720} y={64}  label="OpenAI" sub="GPT-4o" />
        <Box x={720} y={244} label="Anthropic Claude" sub="Sonnet · Opus" />
        <Box x={720} y={424} label="Google Gemini" sub="Flash · Pro" />

        <Box x={400} y={500} w={200} h={48} label="BigQuery Audit" sub="Every call · forever" />
      </svg>

      <Footer idx={3} />
    </div>
  );
}

// ─── C4 — Features ───────────────────────────────────────────
function C4() {
  const cards = [
    { icon: Icon.shield(28, TOK.blue), title: "OSSA Governance",      sub: "Token budgets · Allow/Warn/Stop" },
    { icon: Icon.route(28, TOK.blue),  title: "Multi-Model Routing",  sub: "OpenAI · Anthropic · Google" },
    { icon: Icon.book(28, TOK.blue),   title: "Prompt Library",       sub: "25 techniques · 8 personas" },
    { icon: Icon.chart(28, TOK.blue),  title: "Usage Analytics",      sub: "BigQuery audit · spend insight" },
  ];
  return (
    <div style={{ width: 1080, height: 1080, background: TOK.bgSoft, color: TOK.ink, fontFamily: PLEX, position: "relative", padding: "80px 60px 0", overflow: "hidden" }}>
      <Pill bg={TOK.blueBg} color={TOK.blue} size={11}><Dot s={6} /> FEATURES</Pill>
      <h2 style={{ margin: "20px 0 8px", fontSize: 56, fontWeight: 600, letterSpacing: -1.4, lineHeight: 1.02 }}>
        Everything you need.<br/>
        <span style={{ color: TOK.muted }}>Nothing you don't.</span>
      </h2>

      <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {cards.map(c => (
          <div key={c.title} style={{ background: TOK.white, border: `1px solid ${TOK.line}`, padding: 32, position: "relative", height: 280 }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 56, height: 4, background: TOK.blue }} />
            <div style={{ width: 56, height: 56, background: TOK.blueBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {c.icon}
            </div>
            <div style={{ position: "absolute", left: 32, right: 32, bottom: 32 }}>
              <div style={{ fontSize: 26, fontWeight: 600, color: TOK.ink, letterSpacing: -0.5 }}>{c.title}</div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: TOK.muted, marginTop: 8, letterSpacing: 0.3 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <Footer idx={4} />
    </div>
  );
}

// ─── C5 — CTA ────────────────────────────────────────────────
function C5() {
  const Tier = ({ name, tokens, price, bold }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "20px 0", borderTop: "1px solid rgba(255,255,255,0.25)" }}>
      <div style={{ fontSize: bold ? 28 : 22, fontWeight: bold ? 600 : 500 }}>{name}</div>
      <div style={{ fontFamily: MONO, fontSize: 14, opacity: 0.85 }}>{tokens}</div>
      <div style={{ fontFamily: PLEX, fontSize: bold ? 24 : 20, fontWeight: 600 }}>{price}</div>
    </div>
  );
  return (
    <div style={{ width: 1080, height: 1080, background: TOK.blue, color: TOK.white, fontFamily: PLEX, position: "relative", overflow: "hidden", padding: "80px 60px 0" }}>
      {/* subtle radial highlight */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 80% 0%, rgba(255,255,255,0.16), transparent 50%)" }} />

      <div style={{ position: "relative" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: 2.4, textTransform: "uppercase", opacity: 0.8 }}>Get started</div>
        <h2 style={{ margin: "16px 0 24px", fontSize: 110, fontWeight: 600, letterSpacing: -3, lineHeight: 0.95 }}>
          Start free<br/>today.
        </h2>
        <div style={{ fontSize: 22, opacity: 0.85, maxWidth: 560, fontWeight: 300 }}>
          Three plans. One governed platform. No credit card required to begin.
        </div>

        <div style={{ marginTop: 52 }}>
          <Tier name="Community"  tokens="200K tokens / month" price="Free" bold />
          <Tier name="Student"    tokens="500K tokens / month" price="Free" />
          <Tier name="Developer"  tokens="From 2M tokens / month" price="$9 / mo" />
        </div>

        <a style={{
          display: "inline-flex", alignItems: "center", gap: 12,
          marginTop: 44, padding: "18px 28px",
          border: `1.5px solid ${TOK.white}`, color: TOK.white,
          fontFamily: PLEX, fontWeight: 500, fontSize: 18, textDecoration: "none"
        }}>
          mastechdigital.com/prism
          <span style={{ fontFamily: MONO, fontSize: 16 }}>→</span>
        </a>
      </div>

      <Footer idx={5} dark />
    </div>
  );
}

Object.assign(window, { C1, C2, C3, C4, C5 });
