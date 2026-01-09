"use client";

import dynamic from "next/dynamic";
import type { HomeHeroCard } from "@/types";

const HeroCards = dynamic(() => import("@/components/HeroCards").then((mod) => mod.HeroCards), {
  ssr: false,
});

type Props = {
  cards: HomeHeroCard[];
  prefersLightText: boolean;
};

export function HeroCardsClientOnly({ cards, prefersLightText }: Props) {
  if (!cards.length) return null;
  return <HeroCards cards={cards} prefersLightText={prefersLightText} />;
}
