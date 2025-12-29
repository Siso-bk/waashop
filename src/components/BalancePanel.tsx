interface Props {
  coins: number;
  points: number;
}

export function BalancePanel({ coins, points }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase text-gray-500">Coins</p>
        <p className="text-3xl font-bold text-indigo-600">{coins.toLocaleString()}</p>
        <p className="text-xs text-gray-500">Spend coins to open boxes</p>
      </div>
      <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase text-gray-500">Points</p>
        <p className="text-3xl font-bold text-amber-600">{points.toLocaleString()}</p>
        <p className="text-xs text-gray-500">Points are rewards you keep</p>
      </div>
    </div>
  );
}
