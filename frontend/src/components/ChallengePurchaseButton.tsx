"use client";

import { useState } from "react";
import Link from "next/link";
import { ChallengeProduct } from "@/types";

interface Props {
  challenge: ChallengeProduct;
  signedIn?: boolean;
}

export function ChallengePurchaseButton({ challenge, signedIn = true }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const remaining = Math.max(challenge.ticketCount - challenge.ticketsSold, 0);
  const hasWinner = Boolean(challenge.winnerUserId);
  const winnerLabel = challenge.winnerUsername ? `@${challenge.winnerUsername}` : "Winner";
  const ticketLabel = challenge.winnerTicketNumber ? `Ticket #${challenge.winnerTicketNumber}` : "Winning ticket";

  const handleBuy = async () => {
    if (!signedIn) {
      setNeedsAuth(true);
      setError("Sign in to buy a ticket.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setNeedsAuth(false);
    try {
      const response = await fetch(`/api/challenges/${challenge.id}/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ quantity: 1 }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setNeedsAuth(true);
          throw new Error("Sign in to buy a ticket.");
        }
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
        disabled={isLoading || remaining <= 0 || hasWinner}
        className="w-full rounded-full border border-black bg-[#000] px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {hasWinner
          ? "Winner selected"
          : remaining <= 0
            ? "Sold out"
            : isLoading
              ? "Processing..."
              : "Buy ticket"}
      </button>
      {needsAuth && (
        <Link href="/login" className="text-xs font-semibold text-black underline">
          Sign in to continue
        </Link>
      )}
      {hasWinner && (
        <div className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-[11px] text-gray-600">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Winner</p>
          <p className="mt-1 font-semibold text-black">
            {winnerLabel} · {ticketLabel}
          </p>
          <p className="mt-1 text-[10px] text-gray-500">
            {challenge.prizeDeliveredAt ? "Prize delivered." : "Awaiting prize delivery."}
          </p>
          {!challenge.prizeConfirmedAt && (
            <p className="mt-1 text-[10px] text-gray-400">
              This will show until the winner confirms the prize delivered.
            </p>
          )}
        </div>
      )}
      <div className="min-h-[16px]" aria-live="polite">
        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-emerald-600">{success}</p>}
      </div>
    </div>
  );
}
