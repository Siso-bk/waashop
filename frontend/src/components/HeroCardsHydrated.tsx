"use client";

import { useEffect, useState } from "react";
import { HeroCards } from "@/components/HeroCards";
import type { HomeHeroCard } from "@/types";

type Props = {
  cards: HomeHeroCard[];
  prefersLightText: boolean;
};

export function HeroCardsHydrated({ cards, prefersLightText }: Props) {
  const [mounted, setMounted] = useState(false);
  const first = cards[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!cards.length) return null;

  if (!mounted) {
    return (
      <div className="space-y-3">
        {first?.tagline && (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] opacity-70">{first.tagline}</p>
        )}
        <h3 className="text-xl font-semibold">{first?.title}</h3>
        <p className="text-sm opacity-80">{first?.body}</p>
      </div>
    );
  }

  return <HeroCards cards={cards} prefersLightText={prefersLightText} />;
}
