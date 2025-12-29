"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MysteryBoxDto } from "@/types";
import { SESSION_COOKIE } from "@/lib/constants";

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
    rewardPoints: number;
    tier?: { points: number; probability: number; isTop?: boolean };
  }>(null);
  const [showResult, setShowResult] = useState(false);

  const handleBuy = async () => {
    setIsLoading(true);
    setError(null);
    setShowResult(false);
    try {
      const purchaseId = newPurchaseId();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiBase) {
        throw new Error("Missing API base URL");
      }

      const token = document.cookie
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`))
        ?.split("=")[1];

      if (!token) {
        setError("Please sign in before buying.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${apiBase}/api/boxes/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ boxId: box.boxId, purchaseId }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to complete purchase");
        return;
      }

      setResult({
        purchaseId: data.purchaseId,
        rewardPoints: data.rewardPoints,
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
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isLoading ? "Processing..." : `Open for ${box.priceCoins} coins`}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {result && showResult && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <p className="text-xs uppercase text-gray-400">Mystery Reward</p>
            <p className="mt-2 text-3xl font-bold text-indigo-600 animate-pulse">
              +{result.rewardPoints} pts
            </p>
            {result.tier?.isTop && <p className="mt-1 text-amber-600">Top tier unlocked!</p>}
            <p className="mt-2 text-xs text-gray-500">Purchase #{result.purchaseId}</p>
            <button
              onClick={() => setShowResult(false)}
              className="mt-4 w-full rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
