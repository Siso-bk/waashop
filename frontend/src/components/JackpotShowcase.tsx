"use client";

import { useMemo, useState } from "react";
import { JackpotPlayDto } from "@/types";
import { JackpotPlayButton } from "@/components/JackpotPlayButton";
import { formatMinis } from "@/lib/minis";

type Props = {
  jackpots: JackpotPlayDto[];
  signedIn: boolean;
};

export function JackpotShowcase({ jackpots, signedIn }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(jackpots[0]?.id ?? null);

  const activeJackpot = useMemo(
    () => jackpots.find((jackpot) => jackpot.id === selectedId) ?? jackpots[0],
    [selectedId, jackpots]
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
    <div className="space-y-4">
      {activeJackpot && (
        <article className="jackpot-hero relative overflow-hidden rounded-[28px] border px-4 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:px-8 sm:py-8">
          <div className="jackpot-hero__glow jackpot-hero__glow--right" />
          <div className="jackpot-hero__glow jackpot-hero__glow--left" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="jackpot-hero__eyebrow text-xs font-semibold uppercase tracking-[0.4em]">
                Jackpots play
              </p>
              <h3 className="text-2xl font-semibold sm:text-3xl">{activeJackpot.name}</h3>
              <p className="jackpot-hero__muted hidden max-w-xl text-sm sm:block">
                One try can ignite the pool. Every miss fuels the next winner.
              </p>
              <div className="jackpot-hero__muted flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] sm:text-xs">
                <span className="jackpot-hero__pill rounded-full border px-3 py-1">
                  Try price {formatMinis(activeJackpot.priceMinis)}
                </span>
                <span className="jackpot-hero__pill rounded-full border px-3 py-1 text-[11px] font-semibold text-emerald-400 sm:text-sm">
                  Winner prize {formatMinis(winnerPrize)}
                </span>
              </div>
            </div>
            <div className="jackpot-hero__panel rounded-[24px] border p-4 sm:p-5">
              <p className="jackpot-hero__muted text-[10px] uppercase tracking-[0.3em] sm:text-xs">Live pool</p>
              <p className="jackpot-hero__accent mt-2 text-3xl font-semibold sm:text-4xl">
                {formatMinis(activeJackpot.poolMinis)}
              </p>
              <div className="mt-5">
                <JackpotPlayButton jackpot={activeJackpot} signedIn={signedIn} />
              </div>
            </div>
          </div>
        </article>
      )}

      <div className="shrink-0 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">All jackpots</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {jackpots.map((item) => {
            const total = item.platformPercent + item.seedPercent + item.vendorPercent;
            const prize = Math.max(0, Math.floor(item.poolMinis * (1 - total / 100)));
            const isActive = item.id === activeJackpot?.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`min-w-[180px] flex-1 rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? "border-emerald-300 bg-white shadow-sm shadow-emerald-500/10"
                    : "border-black/10 bg-white hover:border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>TRY PRICE</span>
                  <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    {formatMinis(item.priceMinis)}
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold text-black">{item.name}</p>
                <p className="text-sm font-semibold text-emerald-500">Winner prize {formatMinis(prize)}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
