export default function GovernanceBadge({ decision }: { decision?: string }) {
  const color = decision === "allow" ? "#24a148" : decision === "warn" ? "#f1c21b" : decision === "stop" ? "#da1e28" : "#525252";
  return <span className="rounded px-2 py-1 text-xs" style={{ background: `${color}22`, color }}>{decision ?? "n/a"}</span>;
}
