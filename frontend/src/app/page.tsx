import Link from "next/link";
import { getSessionUser, getActiveBoxes } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { RewardTable } from "@/components/RewardTable";

export default async function HomePage() {
  const [user, boxes] = await Promise.all([getSessionUser(), getActiveBoxes()]);
  const isAuthenticated = Boolean(user);

  const heroStats = [
    { label: "Active drops", value: boxes.length || "Rolling" },
    { label: "Guaranteed minimum", value: `${boxes[0]?.guaranteedMinPoints ?? 600} pts` },
    { label: "Ledger status", value: "Instant + tamperproof" },
  ];

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Waashop</p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Mystery drops with published odds, guaranteed minimums, and Personal AI identity.
            </h1>
            <p className="text-sm text-slate-600">
              Every purchase shows the exact reward tiers, wallet impact, and cooldown policy before you tap buy. Personal
              AI keeps your session consistent across Telegram Mini Apps, desktop web, and the vendor dashboard.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={isAuthenticated ? "/boxes/BOX_1000" : "/login"}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {isAuthenticated ? "Continue shopping" : "Sign in with Personal AI"}
              </Link>
              <Link
                href="/wallet"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                Wallet & ledger
              </Link>
            </div>
            <div className="grid gap-3 pt-4 text-sm text-slate-600 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-slate-400">{stat.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
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
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                  Connect through Personal AI to load your wallet and vendor perks instantly.
                </div>
              )}
            </div>
            <div className="mt-6 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white px-4 py-3">
                <p>Purchase protection</p>
                <p className="mt-1 text-base font-semibold text-slate-900">Idempotent ledger</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white px-4 py-3">
                <p>Top tier cooldown</p>
                <p className="mt-1 text-base font-semibold text-slate-900">7 days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">New shoppers</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">One signup across Mini App, desktop, and dashboard.</h2>
          <p className="mt-2 text-sm text-slate-600">
            Verify your email once with Personal AI, set a password, and unlock coins + vendor access everywhere. We keep
            tokens refreshed automatically.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• Code-protected onboarding</li>
            <li>• Server-issued JWT stored securely</li>
            <li>• Works on Telegram and mobile web</li>
          </ul>
          <Link
            href={isAuthenticated ? "/wallet" : "/login"}
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {isAuthenticated ? "View wallet" : "Create profile"}
          </Link>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Returning shoppers</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">Sign in with Personal AI and resume instantly.</h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter your Personal AI password, we sync ledger entries and balances, and you continue buying curated drops
            without touching another login.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• 7-day rotating tokens</li>
            <li>• Wallet + ledger auto-sync</li>
            <li>• Vendor + admin roles honored automatically</li>
          </ul>
          <Link
            href={isAuthenticated ? "/boxes/BOX_1000" : "/login"}
            className="mt-6 inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
          >
            {isAuthenticated ? "Open featured box" : "Sign in"}
          </Link>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Boxes</p>
            <h2 className="text-2xl font-semibold text-slate-900">Live drops</h2>
            <p className="text-sm text-slate-600">Inspect the tiers, then draw with server-grade randomness.</p>
          </div>
          <Link href="/wallet" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            Wallet & ledger
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {boxes.map((box) => (
            <article
              key={box.boxId}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
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
          {!boxes.length && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No boxes available right now. Follow Waashop announcements for the next drop.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-900/95 p-6 text-white sm:p-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Vendors</p>
            <h3 className="text-xl font-semibold">Drop products on Waashop</h3>
            <p className="text-sm text-slate-200">
              Submit once, get approved, and manage pricing, inventory, and payouts from the dashboard.
            </p>
          </div>
          <div className="space-y-2 text-sm text-slate-200">
            <p>• Transparent cooldown enforcement</p>
            <p>• Built-in ledger & dispute trail</p>
            <p>• Works on web, mobile, and Telegram Mini Apps</p>
          </div>
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
