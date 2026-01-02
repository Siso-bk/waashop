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
    ? "border-white/20 text-white"
    : "border-black/15 text-black";
  const tagText = prefersLightText ? "text-white/70" : "text-black/60";
  const bodyText = prefersLightText ? "text-white/85" : "text-black/70";
  const buttonClass = prefersLightText
    ? "border border-white/40 text-white hover:bg-white/10"
    : "border border-black/30 text-black hover:bg-black/5";

  return (
    <div className="space-y-4">
      {activeCard && (
        <div
          className={`rounded-[28px] border p-6 ${
            prefersLightText
              ? "border-white/25 bg-white/10 text-white/90 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
              : "border-black/10 bg-white text-black/80 shadow-[0_25px_60px_rgba(0,0,0,0.08)]"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              {activeCard.tagline && (
                <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${tagText}`}>{activeCard.tagline}</p>
              )}
              <h3 className="mt-2 text-2xl font-semibold">{activeCard.title}</h3>
            </div>
            {activeCard.ctaLabel && activeCard.ctaHref && (
              <Link
                href={activeCard.ctaHref}
                className={`inline-flex items-center justify-center rounded-full px-6 py-2 text-xs font-semibold transition ${buttonClass}`}
              >
                {activeCard.ctaLabel}
              </Link>
            )}
          </div>
          <p className="mt-4 text-sm leading-relaxed">{activeCard.body}</p>
        </div>
      )}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {visibleCards.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setActiveId(card.id)}
            className={`relative min-w-[180px] max-w-[220px] flex-1 overflow-hidden rounded-2xl border p-3 text-left transition ${
              activeId === card.id
                ? prefersLightText
                  ? "ring-2 ring-white/70 border-white/40"
                  : "ring-2 ring-black/60 border-black/40"
                : prefersLightText
                  ? "hover:border-white/40"
                  : "hover:border-black/30"
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
                    background: prefersLightText
                      ? "linear-gradient(160deg, rgba(0,0,0,0.75), rgba(0,0,0,0.25))"
                      : "linear-gradient(160deg, rgba(255,255,255,0.95), rgba(255,255,255,0.5))",
                    opacity:
                      typeof card.overlayOpacity === "number"
                        ? Math.min(Math.max(card.overlayOpacity, 0.1), 0.95)
                        : 0.4,
                  }}
                />
              </>
            ) : (
              <div
                className={
                  prefersLightText
                    ? "absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),rgba(0,0,0,0.3))]"
                    : "absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.08),rgba(255,255,255,0.9))]"
                }
              />
            )}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end gap-1">
              {card.tagline && (
                <p className={`text-[0.6rem] font-semibold uppercase tracking-[0.3em] ${tagText}`}>
                  {card.tagline}
                </p>
              )}
              <h3 className="text-sm font-semibold">{card.title}</h3>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
