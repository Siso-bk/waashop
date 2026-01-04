const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-slate-200 text-slate-700",
  SUSPENDED: "bg-red-100 text-red-700",
  REJECTED: "bg-red-100 text-red-700",
  PLACED: "bg-slate-100 text-slate-700",
  PACKED: "bg-amber-100 text-amber-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  DISPUTED: "bg-amber-100 text-amber-700",
  REFUNDED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-slate-200 text-slate-600",
  DAMAGED: "bg-red-100 text-red-700",
  UNSUCCESSFUL: "bg-red-100 text-red-700",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  const tone = STATUS_COLORS[status.toUpperCase()] || "bg-slate-100 text-slate-600";
  return <span className={`${base} ${tone} ${className ?? ""}`.trim()}>{status}</span>;
}
