import Link from "next/link";
import { notFound } from "next/navigation";
import { getBoxByBoxId } from "@/lib/queries";
import { getSessionUser } from "@/lib/auth";
import { RewardTable } from "@/components/RewardTable";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";

interface Props {
  params: { boxId: string };
}

type BoxRecord = NonNullable<Awaited<ReturnType<typeof getBoxByBoxId>>>;

const mapBox = (box: BoxRecord) => ({
  id: box._id.toString(),
  boxId: box.boxId,
  name: box.name,
  priceCoins: box.priceCoins,
  guaranteedMinPoints: box.guaranteedMinPoints,
  rewardTiers: box.rewardTiers,
});

export async function generateMetadata({ params }: Props) {
  const box = await getBoxByBoxId(params.boxId);
  if (!box) return { title: "Mystery Box" };
  return { title: `${box.name} | Mystery Wallet` };
}

export default async function BoxDetails({ params }: Props) {
  const [box, user] = await Promise.all([getBoxByBoxId(params.boxId), getSessionUser()]);
  if (!box) {
    notFound();
  }
  const dto = mapBox(box);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to boxes
      </Link>
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase text-gray-500">Box</p>
            <h1 className="text-3xl font-semibold text-gray-900">{dto.name}</h1>
            <p className="text-sm text-gray-500">{dto.priceCoins.toLocaleString()} coins</p>
          </div>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-6 py-4 text-right">
            <p className="text-xs uppercase text-indigo-500">Guaranteed minimum</p>
            <p className="text-2xl font-bold text-indigo-700">{dto.guaranteedMinPoints} pts</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Rewards are calculated on the server with crypto-secure randomness. Top tier prizes have a 7 day cooldown per user and downgrade to the highest non-top tier if on cooldown.
        </p>
        <div className="mt-6">
          <RewardTable tiers={dto.rewardTiers} guaranteedMin={dto.guaranteedMinPoints} />
        </div>
        <div className="mt-6">
          <BoxPurchaseButton box={dto} disabled={!user} />
          {!user && (
            <p className="mt-2 text-xs text-red-500">Log in via Telegram to buy boxes.</p>
          )}
        </div>
      </div>
    </div>
  );
}
