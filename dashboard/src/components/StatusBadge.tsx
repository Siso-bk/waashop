const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-slate-200 text-slate-700",
  SUSPENDED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const tone = STATUS_COLORS[status.toUpperCase()] || "bg-slate-100 text-slate-600";
  return <span className={`${base} ${tone} ${className ?? ""}`.trim()}>{status}</span>;
}
