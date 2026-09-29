export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-block rounded border border-[#4589ff] bg-[#edf5ff] px-2 py-0.5 text-xs font-medium text-[#0f62fe]">
      {status}
    </span>
  );
}
