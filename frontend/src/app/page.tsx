import Link from "next/link";
import Image from "next/image";
import {
  getSessionUser,
  getActiveBoxes,
  getHomeHero,
  getHomeHighlights,
  getPromoCards,
  getChallenges,
  getActiveJackpots,
  getWinners,
  getStandardProducts,
} from "@/lib/queries";
import type { WinnerSpotlightDto } from "@/types";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { ChallengePurchaseButton } from "@/components/ChallengePurchaseButton";
import { JackpotPlayButton } from "@/components/JackpotPlayButton";
import { JackpotAutoRefresh } from "@/components/JackpotAutoRefresh";
import { HeroCardsClientOnly } from "@/components/HeroCardsClientOnly";
import { GuestHighlightsClient } from "@/components/GuestHighlightsClient";
import { formatMinis } from "@/lib/minis";

export default async function HomePage() {
  const [user, boxes, jackpots, hero, highlights, promoCards, challenges, winners, products] = await Promise.all([
    getSessionUser(),
    getActiveBoxes(),
    getActiveJackpots(),
    getHomeHero(),
    getHomeHighlights(),
    getPromoCards(),
    getChallenges(),
    getWinners(),
    getStandardProducts(),
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
      descriptionTone: prefersLightText ? "text-white/80" : "text-[color:var(--app-text-muted)]",
      eyebrowTone: prefersLightText ? "text-white/60" : "text-[color:var(--app-text-muted)]",
      ctaVariant: prefersLightText
        ? "border border-white/40 text-white hover:bg-white/10"
        : "bg-[color:var(--app-text)] text-[color:var(--app-bg)] hover:opacity-90",
    };
  });

  return (
    <div className="space-y-8">
      <section
        className={`rounded-[32px] border px-6 py-8 sm:px-10 ${heroBorderClass} ${heroBackgroundClass} ${heroTextClass}`}
      >
        {heroCards.length > 0 ? (
          <HeroCardsClientOnly cards={heroCards} prefersLightText={heroPrefersLightText} />
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] opacity-70">Waashop</p>
            <h3 className="text-xl font-semibold">New drops, instant rewards</h3>
            <p className="text-sm opacity-80">Explore featured products and live plays curated for you.</p>
          </div>
        )}
      </section>

      <GuestHighlightsClient signedIn={isAuthenticated} highlightCards={highlightCards} />

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
                  <div className="relative h-40 w-full overflow-hidden rounded-xl">
                    <Image
                      src={card.imageUrl}
                      alt={card.title}
                      fill
                      className="object-cover"
                      sizes="240px"
                      unoptimized
                    />
                  </div>
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
            <Link href="/shop?tab=challenges" className="text-sm text-gray-500 hover:text-gray-700">
              View more
            </Link>
          </div>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-3">
            {challenges.map((challenge) => (
              <article key={challenge.id} className="flex min-w-[240px] flex-col gap-3 rounded-2xl border border-black/10 p-4">
                  <header>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Challenge</p>
                    <h3 className="text-xl font-semibold text-black">{challenge.name}</h3>
                    {challenge.description && <p className="text-sm text-gray-600">{challenge.description}</p>}
                  </header>
                  <p className="text-xs text-gray-500">{formatMinis(challenge.ticketPriceMinis ?? 0)} each</p>
                  <ChallengePurchaseButton challenge={challenge} signedIn={Boolean(user)} />
                </article>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <JackpotAutoRefresh enabled={jackpots.length > 0} />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Jackpots</p>
            <p className="text-sm text-gray-600">Try your luck and watch the pool grow.</p>
          </div>
          <Link href="/shop?tab=jackpot-plays" className="text-xs font-semibold text-black">
            View all
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3">
          {jackpots.map((jackpot) => {
            const totalPercent = jackpot.platformPercent + jackpot.seedPercent + jackpot.vendorPercent;
            const winnerPrize = Math.max(0, Math.floor(jackpot.poolMinis * (1 - totalPercent / 100)));
            return (
              <article
                key={jackpot.id}
                className="min-w-[240px] rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>TRY PRICE</span>
                  <span className="rounded-full bg-black px-3 py-1 text-white">
                    {formatMinis(jackpot.priceMinis)}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-black">{jackpot.name}</h3>
                <p className="mt-1 text-xs font-semibold text-emerald-500">Winner prize {formatMinis(winnerPrize)}</p>
                <div className="mt-3">
                  <JackpotPlayButton jackpot={jackpot} signedIn={Boolean(user)} />
                </div>
              </article>
            );
          })}
          {!jackpots.length && (
            <div className="min-w-[240px] rounded-2xl border border-dashed border-black/20 bg-white p-4 text-center text-xs text-gray-500">
              No jackpots available right now.
            </div>
          )}
        </div>
      </section>

      {winners.length > 0 && (
        <section className="space-y-4">
          <WinnerRow title="Challenge winners" entries={winners.filter((w) => w.winnerType === "CHALLENGE")} />
          <WinnerRow title="Mystery box winners" entries={winners.filter((w) => w.winnerType === "MYSTERY_BOX")} />
        </section>
      )}

      {products.length > 0 && (
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Products</p>
              <h2 className="text-2xl font-semibold text-black">Latest arrivals</h2>
            </div>
            <Link href="/shop?tab=products" className="text-sm text-gray-500 hover:text-gray-700">
              View all products
            </Link>
          </div>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-3">
            {products.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                aria-label={`View ${product.name}`}
                className="group flex min-w-[220px] flex-col gap-3 rounded-2xl border border-black/10 p-4 transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-lg"
              >
                {product.imageUrl && (
                  <div className="relative h-32 w-full overflow-hidden rounded-xl border border-black/10 bg-[color:var(--surface-bg)]">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="220px"
                      unoptimized
                    />
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Product</p>
                  <p className="mt-2 text-lg font-semibold text-black">{product.name}</p>
                  {product.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{product.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Price</span>
                  <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    {formatMinis(product.priceMinis)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/shop?tab=products" className="text-xs font-semibold uppercase tracking-[0.3em] text-black">
              View more →
            </Link>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Boxes</p>
            <h2 className="text-2xl font-semibold text-black">Live drops</h2>
          </div>
          <Link href="/shop?tab=mystery-boxes" className="text-sm text-gray-500 hover:text-gray-700">
            View more
          </Link>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-3">
          {boxes.map((box) => {
            const topPrize = Math.max(
              0,
              ...box.rewardTiers.filter((tier) => tier.isTop).map((tier) => tier.minis || 0)
            );
            return (
              <article
                key={box.boxId}
                className="flex min-w-[280px] flex-col rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-black/30 hover:shadow-xl"
              >
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>PRICE PER BOX</span>
                  <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    {formatMinis(box.priceMinis ?? 0)}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-semibold text-black">{box.name}</h3>
                <p className="mt-1 text-sm font-semibold text-emerald-500">
                  Top winner {formatMinis(topPrize)}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                  <span>TRY AND SEE IT NOW</span>
                </div>
                <div className="mt-6">
                  <BoxPurchaseButton box={box} signedIn={Boolean(user)} />
                </div>
              </article>
            );
          })}
          {!boxes.length && (
            <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
              No boxes available right now. Follow Waashop announcements for the next drop.
            </div>
          )}
        </div>
      </section>

      {!user?.roles?.includes("vendor") && (
        <section className="rounded-3xl border border-black bg-black p-6 text-white sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Vendors</p>
              <h3 className="text-xl font-semibold">Drop products on Waashop</h3>
              <p className="text-sm text-white/80">
                One approval unlocks Product, mystery-box and challenge post opportunities.
              </p>
            </div>
            <Link
              href="/vendor/apply"
              className="inline-flex items-center justify-center rounded-full border border-[var(--surface-border)] bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/80 active:scale-[0.98] active:translate-y-px"
            >
              Start vendor application
            </Link>
          </div>
        </section>
      )}
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
            {entry.imageUrl && (
              <div className="relative mb-3 h-28 overflow-hidden rounded-xl border border-black/10 bg-black/5">
                <Image
                  src={entry.imageUrl}
                  alt={entry.headline}
                  fill
                  className="object-cover"
                  sizes="220px"
                  unoptimized
                />
              </div>
            )}
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{entry.winnerName}</p>
            <h3 className="mt-1 text-sm font-semibold text-black">{entry.headline}</h3>
            {entry.description && <p className="text-xs text-gray-500">{entry.description}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
