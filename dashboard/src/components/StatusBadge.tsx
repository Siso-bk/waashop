const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  INACTIVE: "bg-slate-50 text-slate-600 border-slate-200",
  SUSPENDED: "bg-red-100 text-red-700 border-red-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  PLACED: "bg-slate-50 text-slate-600 border-slate-200",
  PACKED: "bg-amber-100 text-amber-700 border-amber-200",
  SHIPPED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  OUT_FOR_DELIVERY: "bg-blue-100 text-blue-700 border-blue-200",
  DELIVERED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DISPUTED: "bg-amber-100 text-amber-700 border-amber-200",
  REFUNDED: "bg-slate-50 text-slate-600 border-slate-200",
  CANCELLED: "bg-slate-50 text-slate-600 border-slate-200",
  DAMAGED: "bg-red-100 text-red-700 border-red-200",
  UNSUCCESSFUL: "bg-red-100 text-red-700 border-red-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const base = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold";
  const tone = STATUS_COLORS[status.toUpperCase()] || "bg-slate-50 text-slate-600 border-slate-200";
  return <span className={`${base} ${tone} ${className ?? ""}`.trim()}>{status}</span>;
}
