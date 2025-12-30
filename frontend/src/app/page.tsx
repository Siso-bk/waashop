import Link from "next/link";
import { getSessionUser, getActiveBoxes } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { RewardTable } from "@/components/RewardTable";

export default async function HomePage() {
  const [user, boxes] = await Promise.all([getSessionUser(), getActiveBoxes()]);

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Waashop</p>
            <h1 className="text-3xl font-bold text-slate-900">Shop curated mystery drops with instant payouts.</h1>
            <p className="text-sm text-slate-600">
              Each box shows the guaranteed minimum, exact reward odds, and wallet impact before you buy. Coins debit and
              reward points credit the moment the draw is complete.
            </p>
            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Wallet sync</p>
                <p className="font-semibold text-slate-900">
                  {user ? "Connected via Personal AI" : "Sign in to load balances"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-400">Fairness</p>
                <p className="font-semibold text-slate-900">Server RNG · top prize cooldown</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={user ? "/boxes/BOX_1000" : "/login"}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-500"
              >
                {user ? "Open featured box" : "Sign in with Personal AI"}
              </Link>
              <Link
                href="/wallet"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                View wallet & ledger
              </Link>
            </div>
          </div>
          <div className="flex-1 rounded-3xl bg-slate-50 p-6">
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
                  Connect through Personal AI to unlock your coins, points, and vendor perks.
                </div>
              )}
            </div>
            <div className="mt-6 space-y-3 text-xs text-slate-500">
              <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white px-4 py-3">
                <span>Guaranteed minimum</span>
                <span className="font-semibold text-slate-900">
                  {boxes[0]?.guaranteedMinPoints ?? 600} pts
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white px-4 py-3">
                <span>Purchase protection</span>
                <span className="font-semibold text-slate-900">Idempotent ledger</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Boxes</p>
            <h2 className="text-2xl font-semibold text-slate-900">Live drops</h2>
          </div>
          <Link href="/wallet" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
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
          {boxes.length === 0 && (
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
              Submit your catalog, get approved once, and manage stock, pricing, and payouts in the dashboard.
            </p>
          </div>
          <div className="space-y-2 text-sm text-slate-200">
            <p>• Transparent cooldown + RNG enforcement</p>
            <p>• Built-in ledger & dispute trail</p>
            <p>• Works on web, mobile, and Telegram Mini Apps</p>
          </div>
          <div className="space-y-3">
            <Link
              href="/login?vendor=1"
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
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
