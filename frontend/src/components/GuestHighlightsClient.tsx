import Link from "next/link";
import type { HomeHighlightCard } from "@/types";

type HighlightCardView = HomeHighlightCard & {
  backgroundClass: string;
  textClass: string;
  borderClass: string;
  descriptionTone: string;
  eyebrowTone: string;
  ctaVariant: string;
  ctaLabel?: string;
  ctaHref?: string;
};

type Props = {
  signedIn: boolean;
  highlightCards: HighlightCardView[];
};

export function GuestHighlightsClient({ signedIn, highlightCards }: Props) {
  if (signedIn) return null;

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {highlightCards.map((card) => (
        <article
          key={card.key}
          className={`highlight-surface rounded-3xl border p-5 shadow-sm ${card.backgroundClass} ${card.borderClass} ${card.textClass}`}
        >
          {card.eyebrow && (
            <p className={`text-xs uppercase tracking-[0.3em] ${card.eyebrowTone}`}>{card.eyebrow}</p>
          )}
          <h2 className="mt-2 text-lg font-semibold">{card.title}</h2>
          {card.description && <p className={`mt-1 text-sm ${card.descriptionTone}`}>{card.description}</p>}
          {card.ctaLabel && card.ctaHref && (
            <Link
              href={card.ctaHref}
              className={`mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${card.ctaVariant}`}
            >
              {card.ctaLabel}
            </Link>
          )}
        </article>
      ))}
    </section>
  );
}
