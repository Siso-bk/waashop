"use client";

import { useEffect, useMemo, useState } from "react";
import { JackpotPlayDto } from "@/types";
import { JackpotPlayButton } from "@/components/JackpotPlayButton";
import { formatMinis } from "@/lib/minis";

type Props = {
  jackpots: JackpotPlayDto[];
  signedIn: boolean;
};

export function JackpotShowcase({ jackpots, signedIn }: Props) {
  const [activeId, setActiveId] = useState<string | null>(jackpots[0]?.id ?? null);

  useEffect(() => {
    if (!jackpots.length) {
      setActiveId(null);
      return;
    }
    setActiveId((current) => {
      if (!current || !jackpots.some((jackpot) => jackpot.id === current)) {
        return jackpots[0].id;
      }
      return current;
    });
  }, [jackpots]);

  const activeJackpot = useMemo(
    () => jackpots.find((jackpot) => jackpot.id === activeId) ?? jackpots[0],
    [activeId, jackpots]
  );

  if (!jackpots.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
        No jackpot plays live right now. Check back soon.
      </div>
    );
  }

  const totalPercent =
    (activeJackpot?.platformPercent ?? 0) +
    (activeJackpot?.seedPercent ?? 0) +
    (activeJackpot?.vendorPercent ?? 0);
  const winnerPrize = Math.max(
    0,
    Math.floor((activeJackpot?.poolMinis ?? 0) * (1 - totalPercent / 100))
  );

  return (
    <div className="space-y-6">
      {activeJackpot && (
        <article className="jackpot-hero relative overflow-hidden rounded-[32px] border px-6 py-10 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:px-10 sm:py-12">
          <div className="jackpot-hero__glow jackpot-hero__glow--right" />
          <div className="jackpot-hero__glow jackpot-hero__glow--left" />
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <p className="jackpot-hero__eyebrow text-xs font-semibold uppercase tracking-[0.4em]">
                Jackpots play
              </p>
              <h3 className="text-3xl font-semibold sm:text-4xl">{activeJackpot.name}</h3>
              <p className="jackpot-hero__muted max-w-xl text-sm">
                One try can ignite the pool. Every miss fuels the next winner.
              </p>
              <div className="jackpot-hero__muted flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em]">
                <span className="jackpot-hero__pill rounded-full border px-3 py-1">
                  Try price {formatMinis(activeJackpot.priceMinis)}
                </span>
                <span className="jackpot-hero__pill rounded-full border px-3 py-1">
                  Winner prize {formatMinis(winnerPrize)}
                </span>
              </div>
            </div>
            <div className="jackpot-hero__panel rounded-[28px] border p-5 sm:p-6">
              <p className="jackpot-hero__muted text-xs uppercase tracking-[0.3em]">Live pool</p>
              <p className="jackpot-hero__accent mt-2 text-4xl font-semibold sm:text-5xl">
                {formatMinis(activeJackpot.poolMinis)}
              </p>
              <div className="mt-5">
                <JackpotPlayButton jackpot={activeJackpot} disabled={!signedIn} />
              </div>
            </div>
          </div>
        </article>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">All jackpots</p>
        <div className="max-h-[360px] space-y-3 overflow-y-auto pr-2">
          {jackpots.map((item) => {
            const total = item.platformPercent + item.seedPercent + item.vendorPercent;
            const prize = Math.max(0, Math.floor(item.poolMinis * (1 - total / 100)));
            const isActive = item.id === activeJackpot?.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? "border-emerald-300 bg-white shadow-sm shadow-emerald-500/10"
                    : "border-black/10 bg-white hover:border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>TRY PRICE</span>
                  <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    {formatMinis(item.priceMinis)}
                  </span>
                </div>
                <p className="mt-2 text-lg font-semibold text-black">{item.name}</p>
                <p className="text-xs text-gray-500">Winner prize {formatMinis(prize)}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
