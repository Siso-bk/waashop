import Link from "next/link";
import { getSessionUser, getActiveBoxes, getHomeHero } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { RewardTable } from "@/components/RewardTable";

export default async function HomePage() {
  const [user, boxes, hero] = await Promise.all([getSessionUser(), getActiveBoxes(), getHomeHero()]);
  const isAuthenticated = Boolean(user);
  const primaryCtaLabel = isAuthenticated
    ? hero.primaryCtaAuthedLabel || hero.primaryCtaLabel
    : hero.primaryCtaLabel;
  const primaryCtaHref = isAuthenticated ? hero.primaryCtaAuthedHref || hero.primaryCtaHref : hero.primaryCtaHref;
  const secondaryCtaLabel = isAuthenticated
    ? hero.secondaryCtaAuthedLabel || hero.secondaryCtaLabel
    : hero.secondaryCtaLabel;
  const secondaryCtaHref = isAuthenticated
    ? hero.secondaryCtaAuthedHref || hero.secondaryCtaHref
    : hero.secondaryCtaHref;

  const heroBackgroundClass = hero.backgroundClass ?? "bg-black";
  const heroTextClass = hero.textClass ?? "text-white";
  const heroPrefersLightText = heroTextClass.includes("white");
  const heroAccentText = heroPrefersLightText ? "text-white/60" : "text-black/60";
  const heroMutedText = heroPrefersLightText ? "text-white/70" : "text-black/70";
  const heroSubtleText = heroPrefersLightText ? "text-white/50" : "text-black/50";
  const heroStrongText = heroPrefersLightText ? "text-white" : "text-black";
  const heroPanelClasses = heroPrefersLightText
    ? "rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur"
    : "rounded-3xl border border-black/10 bg-white p-6 shadow-sm";
  const heroPanelHeaderText = heroAccentText;
  const heroPanelUserText = heroStrongText;
  const heroEmptyStateClasses = heroPrefersLightText
    ? "rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white/80"
    : "rounded-2xl border border-black/10 bg-black/5 p-4 text-sm text-black/70";

  return (
    <div className="space-y-8">
      <section
        className={`rounded-[32px] border border-black/10 px-6 py-10 sm:px-10 ${heroBackgroundClass} ${heroTextClass}`}
      >
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <p className={`text-xs font-semibold uppercase tracking-[0.35em] ${heroAccentText}`}>{hero.tagline}</p>
            <h1 className="text-4xl font-semibold leading-tight">{hero.headline}</h1>
            <p className={`text-sm ${heroMutedText}`}>{hero.description}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              {primaryCtaLabel && primaryCtaHref && (
                <Link
                  href={primaryCtaHref}
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/80"
                >
                  {primaryCtaLabel}
                </Link>
              )}
              {secondaryCtaLabel && secondaryCtaHref && (
                <Link
                  href={secondaryCtaHref}
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
                >
                  {secondaryCtaLabel}
                </Link>
              )}
            </div>
            <div className={`grid gap-4 pt-4 text-xs ${heroMutedText} sm:grid-cols-3`}>
              <div>
                <p className={`uppercase tracking-[0.3em] ${heroSubtleText}`}>Drops</p>
                <p className={`mt-2 text-2xl font-semibold ${heroStrongText}`}>{boxes.length || "—"}</p>
              </div>
              <div>
                <p className={`uppercase tracking-[0.3em] ${heroSubtleText}`}>Guaranteed min</p>
                <p className={`mt-2 text-2xl font-semibold ${heroStrongText}`}>
                  {boxes[0]?.guaranteedMinPoints ?? 600} pts
                </p>
              </div>
              <div>
                <p className={`uppercase tracking-[0.3em] ${heroSubtleText}`}>Ledger</p>
                <p className={`mt-2 text-2xl font-semibold ${heroStrongText}`}>Instant · tamperproof</p>
              </div>
            </div>
          </div>
          <div className={heroPanelClasses}>
            <div className={`flex items-center justify-between text-xs uppercase tracking-[0.3em] ${heroPanelHeaderText}`}>
              <span>Status</span>
              <span className={`font-semibold ${heroPanelUserText}`}>
                {user ? `Hi, ${user.firstName || "Shopper"}` : "Guest"}
              </span>
            </div>
            <div className="mt-4">
              {user ? (
                <BalancePanel
                  coins={user.coinsBalance}
                  points={user.pointsBalance}
                  tone={heroPrefersLightText ? "dark" : "light"}
                />
              ) : (
                <div className={heroEmptyStateClasses}>Sign in to load your wallet instantly.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">New shoppers</p>
          <h2 className="mt-2 text-lg font-semibold text-black">Create once, shop everywhere.</h2>
          <p className="mt-1 text-sm text-gray-600">
            Verify your email, set a password, and your identity stays consistent across every surface.
          </p>
          <Link
            href={isAuthenticated ? "/wallet" : "/login"}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80"
          >
            {isAuthenticated ? "View wallet" : "Create profile"}
          </Link>
        </article>
        <article className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Returning</p>
          <h2 className="mt-2 text-lg font-semibold text-black">Sign in and resume instantly.</h2>
          <p className="mt-1 text-sm text-gray-600">
            Sessions rotate every seven days and Waashop validates them before loading balances or vendor access.
          </p>
          <Link
            href={isAuthenticated ? "/boxes/BOX_1000" : "/login"}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
          >
            {isAuthenticated ? "Open featured box" : "Sign in"}
          </Link>
        </article>
      </section>

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
        <div className="grid gap-6 lg:grid-cols-2">
          {boxes.map((box) => (
            <article
              key={box.boxId}
              className="flex flex-col rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-black/30 hover:shadow-xl"
            >
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Box {box.boxId}</span>
                <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                  {box.priceCoins.toLocaleString()} coins
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-black">{box.name}</h3>
              <p className="text-sm text-gray-600">
                Guaranteed {box.guaranteedMinPoints} pts · crypto-secure randomness · top tier cooldown
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
            href="/login?vendor=1"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/80"
          >
            Start vendor application
          </Link>
        </div>
      </section>
    </div>
  );
}
