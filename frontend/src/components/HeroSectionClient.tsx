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

  if (!cards.length) return null;

  if (!mounted) {
    return (
      <section
        className={`rounded-[32px] border px-6 py-8 sm:px-10 ${borderClass} ${backgroundClass} ${textClass}`}
      >
        <div className="space-y-4">
          <div
            className={`h-28 w-full rounded-2xl ${
              prefersLightText ? "bg-white/10" : "bg-black/5"
            } animate-pulse`}
          />
          <div className="flex gap-3 overflow-x-auto">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className={`min-w-[180px] flex-1 rounded-2xl border p-3 ${
                  prefersLightText ? "border-white/20 bg-white/10" : "border-black/10 bg-black/5"
                } animate-pulse`}
              >
                <div className={`h-3 w-16 rounded-full ${prefersLightText ? "bg-white/20" : "bg-black/10"}`} />
                <div className={`mt-3 h-4 w-24 rounded-full ${prefersLightText ? "bg-white/20" : "bg-black/10"}`} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`rounded-[32px] border px-6 py-8 sm:px-10 ${borderClass} ${backgroundClass} ${textClass}`}
    >
      <HeroCards cards={cards} prefersLightText={prefersLightText} />
    </section>
  );
}
