"use client";

import { useEffect, useMemo, useState } from "react";
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
  const winSound = useMemo(() => (jackpot.winSoundUrl ? new Audio(jackpot.winSoundUrl) : null), [jackpot.winSoundUrl]);
  const loseSound = useMemo(() => (jackpot.loseSoundUrl ? new Audio(jackpot.loseSoundUrl) : null), [jackpot.loseSoundUrl]);

  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => setResult(null), 3500);
    return () => window.clearTimeout(timer);
  }, [result]);

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
      if (data.won && winSound) {
        void winSound.play().catch(() => undefined);
      }
      if (!data.won && loseSound) {
        void loseSound.play().catch(() => undefined);
      }
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
            className={`jackpot-toast absolute left-0 right-0 top-full mt-0.5 mx-auto flex w-full max-w-[360px] items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-[11px] shadow-lg transition-all duration-300 ${
              result.won ? "jackpot-toast--win" : "jackpot-toast--lose"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.28em]">
              <span aria-hidden>{result.won ? "★" : "•"}</span>
              {result.won ? "Winner" : "Try"}
            </div>
            <p className="text-right">
              {result.won ? `+${formatMinis(result.payoutMinis)}` : "Missed · Pool up"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
