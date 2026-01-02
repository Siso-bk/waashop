"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MysteryBoxDto } from "@/types";
import { formatMinis } from "@/lib/minis";

interface Props {
  box: MysteryBoxDto;
  disabled?: boolean;
}

const newPurchaseId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random()}`;
};

export function BoxPurchaseButton({ box, disabled }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<null | {
    purchaseId: string;
    rewardMinis: number;
    tier?: { minis: number; probability: number; isTop?: boolean };
  }>(null);
  const [showResult, setShowResult] = useState(false);

  const handleBuy = async () => {
    setIsLoading(true);
    setError(null);
    setShowResult(false);
    try {
      const purchaseId = newPurchaseId();
      const response = await fetch("/api/boxes/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ boxId: box.boxId, purchaseId }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to complete purchase");
        return;
      }

      setResult({
        purchaseId: data.purchaseId,
        rewardMinis: data.rewardMinis,
        tier: data.tier,
      });
      setShowResult(true);
      router.refresh();
    } catch {
      setError("Unexpected error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleBuy}
        disabled={disabled || isLoading}
        className="w-full rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isLoading ? "Processing..." : `Join for ${formatMinis(box.priceMinis ?? 0)}`}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {result && showResult && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div className="max-w-sm rounded-3xl border border-white/10 bg-black p-6 text-center text-white shadow-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Mystery reward</p>
            <p className="mt-2 text-4xl font-semibold animate-pulse">
              +{formatMinis(result.rewardMinis)}
            </p>
            {result.tier?.isTop && <p className="mt-1 text-white/70">Top tier unlocked</p>}
            <p className="mt-2 text-xs text-white/60">Purchase #{result.purchaseId}</p>
            <button
              onClick={() => setShowResult(false)}
              className="mt-4 w-full rounded-full border border-white px-4 py-2 text-sm font-semibold text-white hover:bg-white hover:text-black"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

