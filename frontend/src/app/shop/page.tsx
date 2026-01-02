import Link from "next/link";
import { getActiveBoxes, getSessionUser } from "@/lib/queries";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { RewardTable } from "@/components/RewardTable";

export default async function ShopPage() {
  const [boxes, user] = await Promise.all([getActiveBoxes(), getSessionUser()]);

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Shop</p>
        <h1 className="text-2xl font-semibold text-black">Play drops</h1>
        <p className="text-sm text-gray-600">Browse every live box with transparent tiers and instant ledger sync.</p>
        {!user && (
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-black px-4 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white"
          >
            Sign in to play
          </Link>
        )}
      </header>
      <div className="flex gap-6 overflow-x-auto pb-3">
        {boxes.map((box) => (
          <article
            key={box.boxId}
            className="flex min-w-[280px] flex-col rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-black/30 hover:shadow-xl"
          >
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Box {box.boxId}</span>
              <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                {box.priceMinis.toLocaleString()}MIN
              </span>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-black">{box.name}</h3>
            <p className="text-sm text-gray-600">
              Guaranteed {box.guaranteedMinMinis}MIN · crypto-secure randomness · top tier cooldown
            </p>
            <div className="mt-4">
              <RewardTable tiers={box.rewardTiers} guaranteedMin={box.guaranteedMinMinis} />
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-gray-500">
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
    </div>
  );
}
