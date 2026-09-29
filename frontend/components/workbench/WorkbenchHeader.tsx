export default function WorkbenchHeader() {
  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid #dcdcdc",
      background: "#ffffff",
      padding: "0 24px",
      height: "56px",
      flexShrink: 0
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "32px",
          height: "32px",
          background: "#0f62fe",
          borderRadius: "6px"
        }} />
        <div>
          <h1 style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#161616",
            margin: 0
          }}>PRISM Workbench</h1>
          <p style={{
            fontSize: "12px",
            color: "#525252",
            margin: "2px 0 0 0"
          }}>Governed Multi-Model AI Engineering Platform</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{
          padding: "4px 8px",
          border: "1px solid #dcdcdc",
          borderRadius: "4px",
          fontSize: "11px",
          color: "#161616",
          background: "#f4f4f4"
        }}>DEV</span>
        <span style={{
          padding: "4px 8px",
          border: "1px solid #dcdcdc",
          borderRadius: "4px",
          fontSize: "11px",
          color: "#161616",
          background: "#ffffff"
        }}>test@mastechdigital.com</span>
      </div>
    </header>
  );
}
