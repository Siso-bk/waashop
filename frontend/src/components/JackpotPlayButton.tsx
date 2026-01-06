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
    <div className="relative space-y-2">
      <button
        onClick={handleTry}
        disabled={disabled || isLoading}
        className="w-full rounded-full border border-white/15 bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isLoading ? "Trying..." : `TRY FOR ${formatMinis(jackpot.priceMinis)}`}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="min-h-[36px]" aria-live="polite">
        {result && (
          <div
            className={`absolute left-0 right-0 top-full mt-2 mx-auto w-full max-w-[360px] origin-center rounded-2xl border px-3 py-2 text-[11px] shadow-lg transition-all duration-300 ${
              result.won
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.28em]">
              <span aria-hidden>{result.won ? "★" : "•"}</span>
              {result.won ? "Winner" : "Try"}
            </div>
            <p className="mt-1">
              {result.won ? `Won ${formatMinis(result.payoutMinis)}.` : "Missed. Pool up."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
