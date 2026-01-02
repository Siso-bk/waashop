import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoxByBoxId, getSessionUser } from "@/lib/queries";
import { RewardTable } from "@/components/RewardTable";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";

interface Props {
  params: { boxId: string };
}

export async function generateMetadata({ params }: Props) {
  const box = await getBoxByBoxId(params.boxId);
  if (!box) return { title: "Waashop Mystery Box" };
  return { title: `${box.name} | Waashop` };
}

export default async function BoxDetails({ params }: Props) {
  const [box, user] = await Promise.all([getBoxByBoxId(params.boxId), getSessionUser()]);
  if (!box) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to boxes
      </Link>
      <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Box</p>
            <h1 className="text-3xl font-semibold text-black">{box.name}</h1>
            <p className="text-sm text-gray-600">{(box.priceMinis ?? 0).toLocaleString()}MIN</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-black px-6 py-4 text-right text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Guaranteed minimum</p>
            <p className="text-2xl font-semibold">{box.guaranteedMinMinis}MIN</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Rewards are calculated on the server with crypto-secure randomness. Top tier prizes have a 7 day cooldown per user and downgrade to the highest non-top tier if on cooldown.
        </p>
        <div className="mt-6">
          <RewardTable tiers={box.rewardTiers} guaranteedMin={box.guaranteedMinMinis} />
        </div>
        <div className="mt-6">
          <BoxPurchaseButton box={box} disabled={!user} />
          {!user && <p className="mt-2 text-xs text-red-500">Log in to buy boxes.</p>}
        </div>
      </div>
    </div>
  );
}
