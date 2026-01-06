"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JackpotPlayDto } from "@/types";
import { formatMinis } from "@/lib/minis";

type Props = {
  jackpot: JackpotPlayDto;
  disabled?: boolean;
};

export function JackpotPlayButton({ jackpot, disabled }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ won: boolean; payoutMinis: number } | null>(null);
  const router = useRouter();

  const handleTry = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch(`/api/jackpots/${jackpot.id}/try`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to try jackpot");
      }
      setResult({ won: data.won, payoutMinis: data.payoutMinis ?? 0 });
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleTry}
        disabled={disabled || isLoading}
        className="w-full rounded-full border border-white/15 bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isLoading ? "Trying..." : `TRY FOR ${formatMinis(jackpot.priceMinis)}`}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {result && (
        <div
          className={`rounded-2xl border px-3 py-2 text-xs ${
            result.won
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.3em]">
            <span aria-hidden>{result.won ? "◎" : "•"}</span>
            {result.won ? "Jackpot win" : "Try complete"}
          </div>
          <p className="mt-1">
            {result.won ? `You won ${formatMinis(result.payoutMinis)}.` : "No win this time. The pool just grew."}
          </p>
        </div>
      )}
    </div>
  );
}
