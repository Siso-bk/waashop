import Link from "next/link";
import { getSessionUser, getActiveBoxes } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { RewardTable } from "@/components/RewardTable";

const featureHighlights = [
  { title: "Secure wallet", detail: "Dual balances keep coins & reward points in sync across devices." },
  { title: "Provable fairness", detail: "Rewards calculated server-side using crypto randomness & cooldowns." },
  { title: "Always transparent", detail: "Reward tables, guaranteed minimums, and vendor provenance are public." },
];

export default async function HomePage() {
  const [user, boxes] = await Promise.all([getSessionUser(), getActiveBoxes()]);

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-indigo-100/70">
        <div className="grid gap-8 p-8 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Waashop Marketplace</p>
            <h1 className="text-3xl font-bold text-slate-900">Mystery commerce with instant wallet sync.</h1>
            <p className="text-sm text-slate-600">
              Discover curated drops from verified vendors, unlock coins-only exclusives, and reveal guaranteed reward
              points that boost your loyalty tier. Built for Telegram Mini Apps but production-ready everywhere.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-600">
              <div className="rounded-full border border-slate-200 px-4 py-2">1-tap Personal AI sign-in</div>
              <div className="rounded-full border border-slate-200 px-4 py-2">Wallet-safe mystery boxes</div>
              <div className="rounded-full border border-slate-200 px-4 py-2">Vendor-grade transparency</div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={user ? "/boxes/BOX_1000" : "/login"}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-400/40 transition hover:bg-indigo-500"
              >
                {user ? "Shop featured drop" : "Sign in to start shopping"}
              </Link>
              <Link
                href="/wallet"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300"
              >
                View wallet
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-100 via-white to-purple-100 opacity-60" />
            <div className="relative space-y-4 rounded-2xl border border-white/60 bg-white/80 p-6 backdrop-blur">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Status</span>
                <span className="font-semibold text-slate-900">
                  {user ? `Hi, ${user.firstName || "mystery buyer"}` : "Not connected"}
                </span>
              </div>
              {user ? (
                <BalancePanel coins={user.coinsBalance} points={user.pointsBalance} />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-slate-600">
                  Connect with Personal AI to sync balances, orders, and vendor approvals.
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                {featureHighlights.map((feature) => (
                  <div key={feature.title} className="rounded-2xl border border-slate-100 bg-white p-3 text-xs">
                    <p className="font-semibold text-slate-900">{feature.title}</p>
                    <p className="mt-1 text-slate-500">{feature.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Featured drops</p>
            <h2 className="text-2xl font-semibold text-slate-900">Active mystery inventory</h2>
          </div>
          <Link href="/wallet" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Wallet & ledger
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          Every box lists its guaranteed minimum points, tier probabilities, and per-user cooldown rules. Coins are
          instantly debited, points instantly credited.
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          {boxes.map((box) => (
            <article
              key={box.boxId}
              className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Box ID · {box.boxId}</span>
                  <span className="rounded-full bg-indigo-50 px-2 py-1 font-semibold text-indigo-600">
                    {box.priceCoins.toLocaleString()} coins
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{box.name}</h3>
                <p className="text-sm text-slate-600">
                  Guaranteed minimum reward {box.guaranteedMinPoints} pts · crypto-grade randomness
                </p>
              </div>
              <div className="mt-4">
                <RewardTable tiers={box.rewardTiers} guaranteedMin={box.guaranteedMinPoints} />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <p>Server draw · Top prize cooldown enforced · Idempotent ledger writes</p>
                <Link href={`/boxes/${box.boxId}`} className="font-semibold text-indigo-600">
                  View details
                </Link>
              </div>
              <div className="mt-6">
                <BoxPurchaseButton box={box} disabled={!user} />
              </div>
            </article>
          ))}
          {boxes.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No boxes available right now. Follow the Waashop channel for the next drop.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-slate-200 bg-slate-900/95 p-8 text-white lg:grid-cols-3">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-slate-400">Vendors</p>
          <h3 className="text-xl font-semibold">Apply to sell mystery inventory</h3>
          <p className="text-sm text-slate-200">
            Multi-vendor controls ensure only approved partners can drop boxes. Submit your catalog for review, get
            analytics, and automate payouts.
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">Compliance</p>
          <ul className="space-y-2 text-sm text-slate-100">
            <li>• Crypto secure RNG & tamper-proof ledger</li>
            <li>• Per-user top tier cooldown enforcement</li>
            <li>• Readable audit via `/wallet` + `/ledger`</li>
          </ul>
        </div>
        <div className="space-y-3">
          <Link
            href="/login?vendor=1"
            className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Start vendor application
          </Link>
          <p className="text-xs text-slate-300">
            Approved vendors get access to the dashboard to manage listings, monitor sales, and trigger restocks.
          </p>
        </div>
      </section>
    </div>
  );
}
