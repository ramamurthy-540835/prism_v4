/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const {
  D1Linkedin, D2Twitter, D3Ossa, D4Pricing, D5Hero, D6Personas,
  C1, C2, C3, C4, C5
} = window;

function App() {
  return (
    <DesignCanvas title="PRISM — Visual Design Kit" subtitle="Original visual language. Plex Sans + JetBrains Mono. Brand color #0f62fe.">
      <DCSection id="social" title="Social posts">
        <DCArtboard id="d1" label="01 · LinkedIn Launch · 1200×627" width={1200} height={627}>
          <D1Linkedin />
        </DCArtboard>
        <DCArtboard id="d2" label="02 · Twitter/X Card · 1200×675" width={1200} height={675}>
          <D2Twitter />
        </DCArtboard>
      </DCSection>

      <DCSection id="features" title="Feature & pricing cards">
        <DCArtboard id="d3" label="03 · OSSA Governance · 1080×1080" width={1080} height={1080}>
          <D3Ossa />
        </DCArtboard>
        <DCArtboard id="d4" label="04 · Pricing Comparison · 1200×627" width={1200} height={627}>
          <D4Pricing />
        </DCArtboard>
      </DCSection>

      <DCSection id="product" title="Product surfaces">
        <DCArtboard id="d5" label="05 · In-App Hero Banner · 1440×320" width={1440} height={320}>
          <D5Hero />
        </DCArtboard>
        <DCArtboard id="d6" label="06 · Persona Showcase · 1080×1080" width={1080} height={1080}>
          <D6Personas />
        </DCArtboard>
      </DCSection>

      <DCSection id="carousel" title="LinkedIn carousel · 5 slides">
        <DCArtboard id="c1" label="07.1 · Hook" width={1080} height={1080}><C1 /></DCArtboard>
        <DCArtboard id="c2" label="07.2 · Problem" width={1080} height={1080}><C2 /></DCArtboard>
        <DCArtboard id="c3" label="07.3 · Solution" width={1080} height={1080}><C3 /></DCArtboard>
        <DCArtboard id="c4" label="07.4 · Features" width={1080} height={1080}><C4 /></DCArtboard>
        <DCArtboard id="c5" label="07.5 · CTA" width={1080} height={1080}><C5 /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
