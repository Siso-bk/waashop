"use client";

import { useState } from "react";
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
        <p className={`text-xs ${result.won ? "text-emerald-600" : "text-slate-500"}`}>
          {result.won ? `You won ${formatMinis(result.payoutMinis)}!` : "No win this time. Pool increased."}
        </p>
      )}
    </div>
  );
}
