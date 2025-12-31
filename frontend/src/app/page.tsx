import Link from "next/link";
import { getSessionUser, getActiveBoxes } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { RewardTable } from "@/components/RewardTable";

export default async function HomePage() {
  const [user, boxes] = await Promise.all([getSessionUser(), getActiveBoxes()]);
  const isAuthenticated = Boolean(user);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Waashop</p>
            <h1 className="text-3xl font-semibold text-slate-900">Mystery drops. Transparent odds. One wallet.</h1>
            <p className="text-sm text-slate-600">
              See the guaranteed minimum and ledger impact before every purchase. Sign in once and shop anywhere—Telegram
              Mini App, desktop web, or dashboard.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={isAuthenticated ? "/boxes/BOX_1000" : "/login"}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {isAuthenticated ? "Continue shopping" : "Sign in"}
              </Link>
              <Link
                href="/wallet"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                Wallet & ledger
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
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
                  Sign in to load your wallet instantly.
                </div>
              )}
            </div>
            <div className="mt-5 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white px-4 py-3">
                <p>Guaranteed minimum</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {boxes[0]?.guaranteedMinPoints ?? 600} pts
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white px-4 py-3">
                <p>Ledger status</p>
                <p className="mt-1 text-base font-semibold text-slate-900">Instant + tamperproof</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">New shoppers</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Create once, shop everywhere.</h2>
          <p className="mt-1 text-sm text-slate-600">
            Verify your email, set a password, and your session stays synced across Mini App, desktop, and dashboard.
          </p>
          <Link
            href={isAuthenticated ? "/wallet" : "/login"}
            className="mt-4 inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            {isAuthenticated ? "View wallet" : "Create profile"}
          </Link>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Returning</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">Sign in and resume instantly.</h2>
          <p className="mt-1 text-sm text-slate-600">
            Tokens rotate every 7 days and Waashop validates them before loading balances or vendor access.
          </p>
          <Link
            href={isAuthenticated ? "/boxes/BOX_1000" : "/login"}
            className="mt-4 inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
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

      <section className="rounded-3xl border border-slate-200 bg-slate-900/95 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Vendors</p>
            <h3 className="text-xl font-semibold">Drop products on Waashop</h3>
            <p className="text-sm text-slate-200">
              One approval unlocks inventory management, payouts, and analytics with Personal AI authentication baked in.
            </p>
          </div>
          <Link
            href="/login?vendor=1"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Start vendor application
          </Link>
        </div>
      </section>
    </div>
  );
}
