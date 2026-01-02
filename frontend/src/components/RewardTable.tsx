import type { RewardTier } from "@/types";

interface Props {
  tiers: RewardTier[];
  guaranteedMin: number;
}

export function RewardTable({ tiers, guaranteedMin }: Props) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-black">Reward table</h3>
        <p className="text-xs text-gray-500">Guaranteed: {guaranteedMin} coins</p>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-black/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-black text-xs uppercase tracking-[0.3em] text-white/80">
            <tr>
              <th className="px-3 py-3 font-normal">Coins</th>
              <th className="px-3 py-3 font-normal">Probability</th>
              <th className="px-3 py-3 font-normal">Tier</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={`${tier.points}-${tier.probability}`} className="border-b border-black/5">
                <td className="px-3 py-3 font-medium text-black">{tier.points}</td>
                <td className="px-3 py-3 text-gray-600">{(tier.probability * 100).toFixed(2)}%</td>
                <td className="px-3 py-3 text-gray-600">{tier.isTop ? "Top" : "Standard"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
