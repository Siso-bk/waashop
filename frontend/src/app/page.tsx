import Link from "next/link";
import {
  getSessionUser,
  getActiveBoxes,
  getHomeHero,
  getHomeHighlights,
  getPromoCards,
  getChallenges,
  getWinners,
} from "@/lib/queries";
import type { WinnerSpotlightDto } from "@/types";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { RewardTable } from "@/components/RewardTable";
import { ChallengePurchaseButton } from "@/components/ChallengePurchaseButton";
import { HeroCards } from "@/components/HeroCards";

export default async function HomePage() {
  const [user, boxes, hero, highlights, promoCards, challenges, winners] = await Promise.all([
    getSessionUser(),
    getActiveBoxes(),
    getHomeHero(),
    getHomeHighlights(),
    getPromoCards(),
    getChallenges(),
    getWinners(),
  ]);
  const heroBackgroundClass = hero.backgroundClass ?? "bg-black";
  const heroTextClass = hero.textClass ?? "text-white";
  const heroPrefersLightText = heroTextClass.includes("white");
  const heroBorderClass = heroPrefersLightText ? "border-white/10" : "border-black/10";
  const heroCards = hero.cards || [];

  const isAuthenticated = !!user;

  const highlightCards = highlights.map((card) => {
    const ctaLabel = isAuthenticated ? card.authedCtaLabel || card.guestCtaLabel : card.guestCtaLabel;
    const ctaHref = isAuthenticated ? card.authedCtaHref || card.guestCtaHref : card.guestCtaHref;
    const textClass = card.textClass || "text-black";
    const prefersLightText = textClass.includes("white");
    return {
      ...card,
      ctaLabel,
      ctaHref,
      backgroundClass: card.backgroundClass || "bg-white",
      textClass,
      borderClass: card.borderClass || "border-black/10",
      descriptionTone: prefersLightText ? "text-white/80" : "text-gray-600",
      eyebrowTone: prefersLightText ? "text-white/60" : "text-gray-400",
      ctaVariant: prefersLightText ? "border border-white/40 text-white hover:bg-white/10" : "bg-black text-white",
    };
  });

  return (
    <div className="space-y-8">
      {heroCards.length > 0 && (
        <section
          className={`rounded-[32px] border px-6 py-8 sm:px-10 ${heroBorderClass} ${heroBackgroundClass} ${heroTextClass}`}
        >
          <HeroCards cards={heroCards} prefersLightText={heroPrefersLightText} />
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        {highlightCards.map((card) => (
          <article
            key={card.key}
            className={`rounded-3xl border p-5 shadow-sm ${card.backgroundClass} ${card.borderClass} ${card.textClass}`}
          >
            {card.eyebrow && (
              <p className={`text-xs uppercase tracking-[0.3em] ${card.eyebrowTone}`}>{card.eyebrow}</p>
            )}
            <h2 className="mt-2 text-lg font-semibold">{card.title}</h2>
            {card.description && <p className={`mt-1 text-sm ${card.descriptionTone}`}>{card.description}</p>}
            {card.ctaLabel && card.ctaHref && (
              <Link
                href={card.ctaHref}
                className={`mt-4 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                  card.ctaVariant
                }`}
              >
                {card.ctaLabel}
              </Link>
            )}
          </article>
        ))}
      </section>

      {promoCards.length > 0 && (
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Promoted</p>
              <h2 className="text-2xl font-semibold text-black">Featured vendor drops</h2>
            </div>
            <p className="text-sm text-gray-500">Sponsored cards curated by Waashop.</p>
          </div>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-3">
            {promoCards.map((card) => (
              <article key={card.id} className="flex min-w-[240px] flex-col gap-4 rounded-2xl border border-black/10 p-4">
                {card.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="h-40 w-full rounded-xl object-cover"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold text-black">{card.title}</h3>
                  {card.description && <p className="mt-1 text-sm text-gray-600">{card.description}</p>}
                </div>
                {card.ctaLabel && card.ctaHref && (
                  <Link
                    href={card.ctaHref}
                    className="inline-flex w-fit items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80"
                  >
                    {card.ctaLabel}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {challenges.length > 0 && (
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Challenges</p>
              <h2 className="text-2xl font-semibold text-black">Play-to-win drops</h2>
            </div>
            <p className="text-sm text-gray-500">Buy tickets. Winner takes the prize.</p>
          </div>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-3">
            {challenges.map((challenge) => {
              const remaining = Math.max(challenge.ticketCount - challenge.ticketsSold, 0);
              return (
                <article key={challenge.id} className="flex min-w-[240px] flex-col gap-3 rounded-2xl border border-black/10 p-4">
                  <header>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Challenge</p>
                    <h3 className="text-xl font-semibold text-black">{challenge.name}</h3>
                    {challenge.description && <p className="text-sm text-gray-600">{challenge.description}</p>}
                  </header>
                  <p className="text-xs text-gray-500">
                    {remaining} of {challenge.ticketCount} tickets remain · {challenge.ticketPriceCoins.toLocaleString()} coins each
                  </p>
                  <ChallengePurchaseButton challenge={challenge} />
                </article>
              );
            })}
          </div>
        </section>
      )}

      {winners.length > 0 && (
        <section className="space-y-4">
          <WinnerRow title="Challenge winners" entries={winners.filter((w) => w.winnerType === "CHALLENGE")} />
          <WinnerRow title="Mystery box winners" entries={winners.filter((w) => w.winnerType === "MYSTERY_BOX")} />
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Boxes</p>
            <h2 className="text-2xl font-semibold text-black">Live drops</h2>
            <p className="text-sm text-gray-600">Inspect tiers, review ledger impact, then draw.</p>
          </div>
          <Link
            href="/wallet"
            className="text-sm font-semibold text-black underline decoration-black/30 underline-offset-4"
          >
            Wallet & ledger
          </Link>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-3">
          {boxes.map((box) => (
            <article
              key={box.boxId}
              className="flex min-w-[280px] flex-col rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-black/30 hover:shadow-xl"
            >
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Box {box.boxId}</span>
                <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                  {box.priceCoins.toLocaleString()} coins
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-black">{box.name}</h3>
              <p className="text-sm text-gray-600">
                Guaranteed {box.guaranteedMinPoints} coins · crypto-secure randomness · top tier cooldown
              </p>
              <div className="mt-4">
                <RewardTable tiers={box.rewardTiers} guaranteedMin={box.guaranteedMinPoints} />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <span>Server draw + automatic ledger entries</span>
                <Link
                  href={`/boxes/${box.boxId}`}
                  className="font-semibold text-black underline decoration-black/15 underline-offset-4"
                >
                  Details
                </Link>
              </div>
              <div className="mt-6">
                <BoxPurchaseButton box={box} disabled={!user} />
              </div>
            </article>
          ))}
          {!boxes.length && (
            <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
              No boxes available right now. Follow Waashop announcements for the next drop.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-black bg-black p-6 text-white sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Vendors</p>
            <h3 className="text-xl font-semibold">Drop products on Waashop</h3>
            <p className="text-sm text-white/80">
              One approval unlocks inventory management, payouts, and analytics across every touchpoint.
            </p>
          </div>
          <Link
            href="/vendor/apply"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/80"
          >
            Start vendor application
          </Link>
        </div>
      </section>
    </div>
  );
}

function WinnerRow({ title, entries }: { title: string; entries: WinnerSpotlightDto[] }) {
  if (!entries.length) return null;
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Winners</p>
          <h2 className="text-lg font-semibold text-black">{title}</h2>
        </div>
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-3">
        {entries.map((entry) => (
          <article key={entry.id} className="min-w-[220px] rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{entry.winnerName}</p>
            <h3 className="mt-1 text-sm font-semibold text-black">{entry.headline}</h3>
            {entry.description && <p className="text-xs text-gray-500">{entry.description}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
