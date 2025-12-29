import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { getActiveBoxes } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { RewardTable } from "@/components/RewardTable";

type BoxRecord = Awaited<ReturnType<typeof getActiveBoxes>>[number];

const mapBox = (box: BoxRecord) => ({
  id: box._id.toString(),
  boxId: box.boxId,
  name: box.name,
  priceCoins: box.priceCoins,
  guaranteedMinPoints: box.guaranteedMinPoints,
  rewardTiers: box.rewardTiers,
});

export default async function HomePage() {
  const [user, boxes] = await Promise.all([getSessionUser(), getActiveBoxes()]);
  const boxDtos = boxes.map(mapBox);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-white/70">Mystery Boxes</p>
            <h1 className="text-3xl font-bold">Open boxes. Earn guaranteed points.</h1>
            <p className="mt-2 text-sm text-white/80">
              Secure draws with transparent reward odds, top prize cooldowns, and server-side fairness.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-right">
            <p className="text-xs uppercase text-white/70">Status</p>
            <p className="text-2xl font-semibold">
              {user ? `Hi, ${user.firstName || "mystery"}` : "Not connected"}
            </p>
          </div>
        </div>
      </section>

      {user ? (
        <BalancePanel coins={user.coinsBalance} points={user.pointsBalance} />
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
          Connect through the Telegram Mini App to load your wallet. Auth is enforced via Telegram initData.
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Active Mystery Boxes</h2>
          <Link href="/wallet" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View wallet
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {boxDtos.map((box) => (
            <div key={box.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-gray-800">{box.name}</p>
                <p className="text-xs text-gray-500">
                  {box.priceCoins.toLocaleString()} coins · Guaranteed {box.guaranteedMinPoints} pts minimum
                </p>
              </div>
              <div className="mt-4">
                <RewardTable tiers={box.rewardTiers} guaranteedMin={box.guaranteedMinPoints} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <p>Server-drawn randomness · Idempotent purchase flow</p>
                <Link href={`/boxes/${box.boxId}`} className="font-semibold text-indigo-600">
                  Details
                </Link>
              </div>
              <div className="mt-4">
                <BoxPurchaseButton box={box} disabled={!user} />
              </div>
            </div>
          ))}
          {boxDtos.length === 0 && <p className="text-sm text-gray-500">No boxes available.</p>}
        </div>
      </section>
    </div>
  );
}
