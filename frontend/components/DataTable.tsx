export default function DataTable({ title, rows }: { title: string; rows: Record<string, unknown>[] }) {
  const columns = rows?.length ? Object.keys(rows[0]) : [];
  return (
    <section className="ibm-panel p-0 overflow-auto">
      {title && (
        <div className="p-4 border-b border-[#dcdcdc]">
          <h3 className="text-sm font-semibold text-[#161616]">{title}</h3>
        </div>
      )}
      {!rows?.length ? (
        <div className="p-6 text-sm text-[#525252]">No rows</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[#dcdcdc]">
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#525252]">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-[#dcdcdc] hover:bg-[#f4f7fb]">
                {columns.map((c) => (
                  <td key={c} className="px-4 py-3 text-[#161616]">{String(r[c] ?? "—")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
