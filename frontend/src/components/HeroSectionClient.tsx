"use client";

import { useEffect, useState } from "react";
import { HeroCards } from "@/components/HeroCards";
import type { HomeHeroCard } from "@/types";

type Props = {
  cards: HomeHeroCard[];
  prefersLightText: boolean;
  borderClass: string;
  backgroundClass: string;
  textClass: string;
};

export function HeroSectionClient({
  cards,
  prefersLightText,
  borderClass,
  backgroundClass,
  textClass,
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !cards.length) return null;

  return (
    <section
      className={`rounded-[32px] border px-6 py-8 sm:px-10 ${borderClass} ${backgroundClass} ${textClass}`}
    >
      <HeroCards cards={cards} prefersLightText={prefersLightText} />
    </section>
  );
}
