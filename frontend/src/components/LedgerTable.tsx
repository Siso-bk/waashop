"use client";

import type { LedgerEntryDto } from "@/types";
import { useState } from "react";

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
  const [expanded, setExpanded] = useState(false);
  const visibleEntries = expanded ? entries : [];
  return (
    <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Transactions</p>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="rounded-full border border-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
        >
          {expanded ? "Fold" : "Expand"}
        </button>
      </div>
      <div className={`overflow-x-auto ${expanded ? "max-h-[520px]" : "max-h-[260px]"} overflow-y-auto`}>
        <table className="min-w-[640px] w-full text-sm">
          <thead className="bg-black text-xs uppercase tracking-[0.3em] text-white/70">
            <tr>
              <th className="px-4 py-3 text-left font-normal">Reason</th>
              <th className="px-4 py-3 text-right font-normal">MINI</th>
              <th className="px-4 py-3 text-right font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            {expanded && entries.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={3}>
                  No ledger entries yet.
                </td>
              </tr>
            )}
            {visibleEntries.map((entry) => (
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
