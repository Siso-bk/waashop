import Link from "next/link";
import { getSessionUser, getActiveBoxes } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { RewardTable } from "@/components/RewardTable";

export default async function HomePage() {
  const [user, boxes] = await Promise.all([getSessionUser(), getActiveBoxes()]);
  const isAuthenticated = Boolean(user);

  const heroStats = [
    { label: "Active drops", value: boxes.length ? `${boxes.length}` : "Launching daily" },
    { label: "Guaranteed minimum", value: `${boxes[0]?.guaranteedMinPoints ?? 600} pts` },
    { label: "Ledger entries", value: "Instant + tamperproof" },
  ];

  const shopperTracks = [
    {
      title: "New to Waashop",
      description: "Verify your email with Personal AI, set a password once, and unlock coins + vendor perks instantly.",
      cta: isAuthenticated ? { href: "/wallet", label: "View wallet" } : { href: "/login", label: "Create profile" },
      highlights: ["Code-protected signup", "Server-issued JWT", "Unified across Mini App + dashboard"],
    },
    {
      title: "Returning shopper",
      description:
        "Sign in with your Personal AI password and we’ll sync wallet balances, ledgers, and vendor access automatically.",
      cta: isAuthenticated
        ? { href: "/boxes/BOX_1000", label: "Resume shopping" }
        : { href: "/login", label: "Sign in" },
      highlights: ["7-day rotating tokens", "Waashop ↔ Telegram sync", "Audit-ready ledgers"],
    },
  ];

  return (
    <div className="space-y-12">
      <section className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-indigo-50/80 to-slate-100 p-6 shadow-lg shadow-indigo-100/50 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Waashop</p>
              <h1 className="text-4xl font-semibold text-slate-900">
                Mystery drops engineered for transparency, instant payouts, and Personal AI identity.
              </h1>
              <p className="text-sm text-slate-600">
                Every box publishes its odds, guaranteed minimum, and ledger impact before you tap buy. Personal AI keeps
                your session synced everywhere—Telegram Mini App, desktop, and the vendor dashboard.
              </p>
            </div>
            <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/70"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={isAuthenticated ? "/boxes/BOX_1000" : "/login"}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-900/10 transition hover:bg-slate-800"
              >
                {isAuthenticated ? "Continue shopping" : "Sign in with Personal AI"}
              </Link>
              <Link
                href="/wallet"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400"
              >
                View wallet & ledger
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-indigo-100/70">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Status</span>
              <span className="font-semibold text-slate-900">
                {user ? `Hi, ${user.firstName || "Waashop shopper"}` : "Not connected"}
              </span>
            </div>
            <div className="mt-4">
              {user ? (
                <BalancePanel coins={user.coinsBalance} points={user.pointsBalance} />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  Sign in to load your coins, auto-sync ledger entries, and unlock vendor perks without leaving Waashop.
                </div>
              )}
            </div>
            <div className="mt-6 grid gap-4 text-xs text-slate-500 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <p>Guaranteed minimum</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {boxes[0]?.guaranteedMinPoints ?? 600} pts
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                <p>Purchase protection</p>
                <p className="mt-1 text-base font-semibold text-slate-900">Idempotent ledger + cooldown</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {shopperTracks.map((track) => (
          <article
            key={track.title}
            className="flex flex-col rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm shadow-indigo-100/40"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
              <span>{track.title}</span>
              <span>Personal AI security</span>
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-slate-900">{track.description}</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {track.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-500" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex-1" />
            <Link
              href={track.cta.href}
              className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-500"
            >
              {track.cta.label}
            </Link>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Boxes</p>
            <h2 className="text-3xl font-semibold text-slate-900">Live drops</h2>
            <p className="text-sm text-slate-600">Tap a box to inspect the precise reward tiers before committing.</p>
          </div>
          <Link href="/wallet" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            Wallet & ledger
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {boxes.map((box) => (
            <article
              key={box.boxId}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Box {box.boxId}</span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-600">
                  {box.priceCoins.toLocaleString()} coins
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">{box.name}</h3>
              <p className="text-sm text-slate-600">
                Guaranteed {box.guaranteedMinPoints} pts · crypto-secure randomness · top tier cooldown
              </p>
              <div className="mt-4">
                <RewardTable tiers={box.rewardTiers} guaranteedMin={box.guaranteedMinPoints} />
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>Server draw + automatic ledger entries</span>
                <Link href={`/boxes/${box.boxId}`} className="font-semibold text-indigo-600">
                  Details
                </Link>
              </div>
              <div className="mt-6">
                <BoxPurchaseButton box={box} disabled={!user} />
              </div>
            </article>
          ))}
          {boxes.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No boxes available right now. Follow Waashop announcements for the next drop.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[32px] border border-slate-200 bg-slate-900/95 p-6 text-white shadow-lg sm:p-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Vendors</p>
            <h3 className="text-2xl font-semibold">Drop products on Waashop</h3>
            <p className="text-sm text-slate-200">
              Submit once, get approved, and manage pricing, supply, and analytics from the dashboard with Personal AI
              authentication included.
            </p>
          </div>
          <ul className="space-y-2 text-sm text-slate-200">
            <li>• Transparent cooldown + RNG enforcement</li>
            <li>• Built-in ledger & dispute trail</li>
            <li>• Works on web, mobile, and Telegram Mini Apps</li>
          </ul>
          <div className="space-y-3">
            <Link
              href="/login?vendor=1"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Start vendor application
            </Link>
            <p className="text-xs text-slate-300">Approved vendors unlock analytics and instant wallet payouts.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
