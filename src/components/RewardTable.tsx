import type { RewardTier } from "@/types";

interface Props {
  tiers: RewardTier[];
  guaranteedMin: number;
}

export function RewardTable({ tiers, guaranteedMin }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Reward Table</h3>
        <p className="text-xs text-gray-500">Guaranteed: {guaranteedMin} pts</p>
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Points</th>
              <th className="px-3 py-2">Probability</th>
              <th className="px-3 py-2">Tier</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={`${tier.points}-${tier.probability}`} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 font-medium text-gray-900">{tier.points}</td>
                <td className="px-3 py-2 text-gray-600">{(tier.probability * 100).toFixed(2)}%</td>
                <td className="px-3 py-2 text-gray-600">{tier.isTop ? "Top" : "Standard"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
