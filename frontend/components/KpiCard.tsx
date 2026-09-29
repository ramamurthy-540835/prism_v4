export default function KpiCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="ibm-kpi">
      <div className="ibm-kpi-accent" />
      <div className="p-4">
        <div className="ibm-label">{title}</div>
        <div className="mt-2 text-2xl font-semibold text-[#161616]">{value ?? "—"}</div>
      </div>
    </div>
  );
}
