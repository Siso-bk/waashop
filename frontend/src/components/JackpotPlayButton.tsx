"use client";

import { useEffect, useRef, useState } from "react";
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
  const [animatedPayout, setAnimatedPayout] = useState(0);
  const animationRef = useRef<number | null>(null);
  const router = useRouter();
  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => setResult(null), 3500);
    return () => window.clearTimeout(timer);
  }, [result]);

  useEffect(() => {
    if (!result || !result.won) {
      setAnimatedPayout(0);
      return;
    }
    if (typeof window === "undefined") return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) {
      setAnimatedPayout(result.payoutMinis);
      return;
    }
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
    }
    const start = window.performance.now();
    const duration = 900;
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedPayout(result.payoutMinis * eased);
      if (progress < 1) {
        animationRef.current = window.requestAnimationFrame(step);
      } else {
        animationRef.current = null;
        setAnimatedPayout(result.payoutMinis);
      }
    };
    animationRef.current = window.requestAnimationFrame(step);
    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
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
      const won = Boolean(data.won);
      setResult({ won, payoutMinis: data.payoutMinis ?? 0 });
      if (typeof window !== "undefined") {
        const soundUrl = won ? jackpot.winSoundUrl : jackpot.loseSoundUrl;
        if (soundUrl) {
          const audio = new Audio(soundUrl);
          audio.currentTime = 0;
          void audio.play().catch(() => undefined);
        }
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
            className={`jackpot-toast absolute left-0 right-0 top-full -mt-8 mx-auto flex w-full max-w-[360px] items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-[11px] shadow-lg transition-all duration-300 ${
              result.won ? "jackpot-toast--win" : "jackpot-toast--lose"
            }`}
          >
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.28em]">
                <span aria-hidden>{result.won ? "★" : "•"}</span>
                {result.won ? "Winner" : "Try"}
              </div>
              {result.won && (
                <p className="text-2xl font-semibold text-emerald-500">
                  +{formatMinis(animatedPayout)}
                </p>
              )}
            </div>
            <p className="text-right">
              {result.won ? "Payout locked" : "Missed · Pool up"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
