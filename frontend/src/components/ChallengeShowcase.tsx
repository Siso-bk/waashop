"use client";

import { useEffect, useMemo, useState } from "react";
import { ChallengeProduct } from "@/types";
import { ChallengePurchaseButton } from "@/components/ChallengePurchaseButton";
import { formatMinis } from "@/lib/minis";

type Props = {
  challenges: ChallengeProduct[];
};

export function ChallengeShowcase({ challenges }: Props) {
  const [activeId, setActiveId] = useState<string | null>(challenges[0]?.id ?? null);

  useEffect(() => {
    if (!challenges.length) {
      setActiveId(null);
      return;
    }
    setActiveId((current) => {
      if (!current || !challenges.some((challenge) => challenge.id === current)) {
        return challenges[0].id;
      }
      return current;
    });
  }, [challenges]);

  const activeChallenge = useMemo(
    () => challenges.find((challenge) => challenge.id === activeId) ?? challenges[0],
    [activeId, challenges]
  );

  if (!challenges.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
        No challenges available right now. Check back soon.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <article className="jackpot-hero relative overflow-hidden rounded-[28px] border px-4 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:px-8 sm:py-8">
        <div className="jackpot-hero__glow jackpot-hero__glow--right" />
        <div className="jackpot-hero__glow jackpot-hero__glow--left" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="jackpot-hero__eyebrow text-xs font-semibold uppercase tracking-[0.4em]">
              Challenge
            </p>
            <h3 className="text-2xl font-semibold sm:text-3xl">{activeChallenge.name}</h3>
            {activeChallenge.description && (
              <p className="jackpot-hero__muted hidden max-w-xl text-sm sm:block">
                {activeChallenge.description}
              </p>
            )}
            <div className="jackpot-hero__muted flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] sm:text-xs">
              <span className="jackpot-hero__pill rounded-full border px-3 py-1">
                Ticket {formatMinis(activeChallenge.ticketPriceMinis)}
              </span>
              <span className="jackpot-hero__pill rounded-full border px-3 py-1">
                Play now
              </span>
            </div>
          </div>
          <div className="jackpot-hero__panel rounded-[24px] border p-4 sm:p-5">
            <p className="jackpot-hero__muted text-[10px] uppercase tracking-[0.3em] sm:text-xs">Ticket price</p>
            <p className="jackpot-hero__accent mt-2 text-3xl font-semibold sm:text-4xl">
              {formatMinis(activeChallenge.ticketPriceMinis)}
            </p>
            <div className="mt-5">
              <ChallengePurchaseButton challenge={activeChallenge} />
            </div>
          </div>
        </div>
      </article>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">All challenges</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {challenges.map((challenge) => {
            const isActive = challenge.id === activeChallenge?.id;
            return (
              <button
                key={challenge.id}
                type="button"
                onClick={() => setActiveId(challenge.id)}
                className={`min-w-[180px] flex-1 rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? "border-emerald-300 bg-white shadow-sm shadow-emerald-500/10"
                    : "border-black/10 bg-white hover:border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>TICKET</span>
                  <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    {formatMinis(challenge.ticketPriceMinis)}
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold text-black">{challenge.name}</p>
                <p className="text-[10px] text-gray-500">Play now</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
