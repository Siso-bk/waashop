import type { LedgerEntryDto } from "@/types";

interface Props {
  entries: LedgerEntryDto[];
}

const formatDelta = (value: number) => {
  if (!value) return "-";
  const unit = Math.abs(value) === 1 ? "MINI" : "MINIS";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString()} ${unit}`;
};

export function LedgerTable({ entries }: Props) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full text-sm">
        <thead className="bg-black text-xs uppercase tracking-[0.3em] text-white/70">
          <tr>
            <th className="px-4 py-3 text-left font-normal">Reason</th>
            <th className="px-4 py-3 text-right font-normal">MINI</th>
            <th className="px-4 py-3 text-right font-normal">Date</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500" colSpan={3}>
                No ledger entries yet.
              </td>
            </tr>
          )}
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t border-black/5">
              <td className="px-4 py-3 font-medium text-black">{entry.reason}</td>
              <td className="px-4 py-3 text-right text-gray-600">{formatDelta(entry.deltaMinis)}</td>
              <td className="px-4 py-3 text-right text-gray-500">
                {new Date(entry.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
