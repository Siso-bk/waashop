import type { LedgerEntryDto } from "@/types";

interface Props {
  entries: LedgerEntryDto[];
}

const formatDelta = (value: number, suffix: string) => {
  if (!value) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value} ${suffix}`;
};

export function LedgerTable({ entries }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">Reason</th>
            <th className="px-4 py-3 text-right">Coins</th>
            <th className="px-4 py-3 text-right">Points</th>
            <th className="px-4 py-3 text-right">Date</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>
                No ledger entries yet.
              </td>
            </tr>
          )}
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t border-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">{entry.reason}</td>
              <td className="px-4 py-3 text-right text-gray-600">
                {formatDelta(entry.deltaCoins, "coins")}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">
                {formatDelta(entry.deltaPoints, "pts")}
              </td>
              <td className="px-4 py-3 text-right text-gray-500">
                {new Date(entry.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
