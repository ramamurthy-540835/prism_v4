export default function ExecutionTrace({ steps, data }: { steps: string[]; data?: any }) {
  return (
    <ol className="space-y-2 text-sm">
      <li className="rounded border border-[#dcdcdc] bg-white px-3 py-2 text-[#161616]">
        <span className="text-[#24a148]">✓</span> OSSA budget check — {data?.ossaDecision === "allow" ? "Allowed" : data?.ossaDecision === "warn" ? "Warning" : "Blocked"} {data?.reason ? `(${data.reason})` : ""}
      </li>
      <li className="rounded border border-[#dcdcdc] bg-white px-3 py-2 text-[#161616]">
        <span className="text-[#24a148]">✓</span> Model resolved — <span className="font-mono text-xs">{data?.modelId ?? "N/A"}</span> via <span className="text-xs font-medium">{data?.provider ?? "N/A"}</span>
      </li>
      <li className="rounded border border-[#dcdcdc] bg-white px-3 py-2 text-[#161616]">
        <span className="text-[#24a148]">✓</span> Prompt type — {data?.promptTypeName ?? "N/A"} v{data?.promptVersion ?? "v1"}
      </li>
      <li className="rounded border border-[#dcdcdc] bg-white px-3 py-2 text-[#161616]">
        <span className="text-[#24a148]">✓</span> API call — <span className="font-mono text-xs">{data?.latencyMs ?? "N/A"}ms</span>
      </li>
      <li className="rounded border border-[#dcdcdc] bg-white px-3 py-2 text-[#161616]">
        <span className="text-[#24a148]">✓</span> BigQuery logged — ctoteam.prism.prism_usage
      </li>
    </ol>
  );
}
