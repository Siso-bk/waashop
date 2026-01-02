"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { HomeHeroCard } from "@/types";

type Props = {
  cards: HomeHeroCard[];
  prefersLightText: boolean;
};

export function HeroCards({ cards, prefersLightText }: Props) {
  const visibleCards = useMemo(
    () => cards.filter((card) => card.status !== "DRAFT"),
    [cards]
  );
  const [activeId, setActiveId] = useState<string | null>(visibleCards[0]?.id ?? null);
  const activeCard = activeId ? visibleCards.find((card) => card.id === activeId) : undefined;

  const cardClasses = prefersLightText
    ? "border-white/15 text-white"
    : "border-black/10 text-black";
  const tagText = prefersLightText ? "text-white/70" : "text-black/60";
  const bodyText = prefersLightText ? "text-white/80" : "text-black/70";
  const buttonClass = prefersLightText
    ? "border border-white/40 text-white hover:bg-white/10"
    : "border border-black/30 text-black hover:bg-black/5";

  return (
    <div className="space-y-4">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {visibleCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setActiveId(card.id)}
            className={`relative min-w-[240px] max-w-[280px] flex-1 overflow-hidden rounded-2xl border p-4 text-left transition ${
              activeId === card.id ? (prefersLightText ? "ring-2 ring-white/60" : "ring-2 ring-black/50") : ""
            } ${cardClasses}`}
            aria-pressed={activeId === card.id}
            aria-label={card.title}
          >
            {card.imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.imageUrl}
                  alt={card.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: prefersLightText ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)",
                    opacity:
                      typeof card.overlayOpacity === "number"
                        ? Math.min(Math.max(card.overlayOpacity, 0), 0.95)
                        : 0.35,
                  }}
                />
              </>
            ) : (
              <div className={prefersLightText ? "absolute inset-0 bg-white/5" : "absolute inset-0 bg-black/5"} />
            )}
          </button>
        ))}
      </div>
      {activeCard && (
        <div className={prefersLightText ? "text-white/80" : "text-black/70"}>
          {activeCard.tagline && (
            <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${tagText}`}>{activeCard.tagline}</p>
          )}
          <h3 className="mt-2 text-lg font-semibold">{activeCard.title}</h3>
          <p className="mt-2 text-sm">{activeCard.body}</p>
          {activeCard.ctaLabel && activeCard.ctaHref && (
            <Link
              href={activeCard.ctaHref}
              className={`mt-3 inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition ${buttonClass}`}
            >
              {activeCard.ctaLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
