"use client";

import { useEffect, useMemo, useState } from "react";
import { MysteryBoxDto } from "@/types";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { formatMinis } from "@/lib/minis";

type Props = {
  boxes: MysteryBoxDto[];
  signedIn: boolean;
};

export function MysteryBoxShowcase({ boxes, signedIn }: Props) {
  const [activeId, setActiveId] = useState<string | null>(boxes[0]?.id ?? null);

  useEffect(() => {
    if (!boxes.length) {
      setActiveId(null);
      return;
    }
    setActiveId((current) => {
      if (!current || !boxes.some((box) => box.id === current)) {
        return boxes[0].id;
      }
      return current;
    });
  }, [boxes]);

  const activeBox = useMemo(
    () => boxes.find((box) => box.id === activeId) ?? boxes[0],
    [activeId, boxes]
  );

  if (!boxes.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
        No boxes available right now. Check back soon.
      </div>
    );
  }

  const topPrize = Math.max(
    0,
    ...activeBox.rewardTiers.filter((tier) => tier.isTop).map((tier) => tier.minis || 0)
  );

  return (
    <div className="space-y-4">
      <article className="jackpot-hero relative overflow-hidden rounded-[28px] border px-4 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:px-8 sm:py-8">
        <div className="jackpot-hero__glow jackpot-hero__glow--right" />
        <div className="jackpot-hero__glow jackpot-hero__glow--left" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="jackpot-hero__eyebrow text-xs font-semibold uppercase tracking-[0.4em]">
              Mystery box
            </p>
            <h3 className="text-2xl font-semibold sm:text-3xl">{activeBox.name}</h3>
            <p className="jackpot-hero__muted hidden max-w-xl text-sm sm:block">
              One box can reveal the top winner. Every drop is instant.
            </p>
            <div className="jackpot-hero__muted flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.3em] sm:text-xs">
              <span className="jackpot-hero__pill rounded-full border px-3 py-1">
                Price {formatMinis(activeBox.priceMinis)}
              </span>
              <span className="jackpot-hero__pill rounded-full border px-3 py-1 text-[11px] font-semibold sm:text-sm">
                Top winner {formatMinis(topPrize)}
              </span>
            </div>
          </div>
          <div className="jackpot-hero__panel rounded-[24px] border p-4 sm:p-5">
            <p className="jackpot-hero__muted text-[10px] uppercase tracking-[0.3em] sm:text-xs">Live drop</p>
            <p className="jackpot-hero__accent mt-2 text-3xl font-semibold sm:text-4xl">
              {formatMinis(activeBox.priceMinis)}
            </p>
            <div className="mt-5">
              <BoxPurchaseButton box={activeBox} signedIn={signedIn} />
            </div>
          </div>
        </div>
      </article>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">All boxes</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {boxes.map((box) => {
            const isActive = box.id === activeBox?.id;
            const top = Math.max(0, ...box.rewardTiers.filter((tier) => tier.isTop).map((tier) => tier.minis || 0));
            return (
              <button
                key={box.id}
                type="button"
                onClick={() => setActiveId(box.id)}
                className={`min-w-[180px] flex-1 rounded-2xl border p-3 text-left transition ${
                  isActive
                    ? "border-emerald-300 bg-white shadow-sm shadow-emerald-500/10"
                    : "border-black/10 bg-white hover:border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>PRICE</span>
                  <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    {formatMinis(box.priceMinis)}
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold text-black">{box.name}</p>
                <p className="text-sm font-semibold text-black/80">Top winner {formatMinis(top)}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
