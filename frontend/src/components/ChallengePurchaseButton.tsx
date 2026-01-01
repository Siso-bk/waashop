"use client";

import { useState } from "react";
import { ChallengeProduct } from "@/types";
import { SESSION_COOKIE } from "@/lib/constants";

interface Props {
  challenge: ChallengeProduct;
}

export function ChallengePurchaseButton({ challenge }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const remaining = Math.max(challenge.ticketCount - challenge.ticketsSold, 0);

  const handleBuy = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
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
        return;
      }
      const response = await fetch(`${apiBase}/api/challenges/${challenge.id}/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: 1 }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to buy ticket");
      }
      setSuccess("Ticket purchased. Good luck!");
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
        onClick={handleBuy}
        disabled={isLoading || remaining <= 0}
        className="w-full rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {remaining <= 0 ? "Sold out" : isLoading ? "Processing..." : "Buy ticket"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-emerald-600">{success}</p>}
    </div>
  );
}
