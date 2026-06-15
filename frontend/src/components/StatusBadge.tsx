import { STATUS_LABELS, statusCor, STATUS_ICONE } from "@/lib/status";

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${statusCor(status)}`}>
      <span>{STATUS_ICONE[status] ?? "•"}</span>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
