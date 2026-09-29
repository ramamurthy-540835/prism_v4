export default function TokenMeter({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 95 ? "#da1e28" : pct >= 70 ? "#f1c21b" : "#0f62fe";
  return (
    <div className="w-full rounded-full bg-[#dcdcdc] h-2">
      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
