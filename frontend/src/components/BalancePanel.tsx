interface Props {
  coins: number;
  points: number;
  tone?: "light" | "dark";
}

export function BalancePanel({ coins, points, tone = "light" }: Props) {
  const isDark = tone === "dark";
  const container =
    "rounded-2xl p-4" +
    (isDark
      ? " border border-white/20 bg-white/10 text-white"
      : " border border-black/10 bg-white text-black");
  const label = isDark ? "text-white/60" : "text-gray-500";
  const description = isDark ? "text-white/70" : "text-gray-500";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className={container}>
        <p className={`text-xs uppercase tracking-[0.3em] ${label}`}>Coins</p>
        <p className="mt-2 text-3xl font-semibold">{coins.toLocaleString()}</p>
        <p className={`text-xs ${description}`}>Spend coins to open boxes</p>
      </div>
      <div className={container}>
        <p className={`text-xs uppercase tracking-[0.3em] ${label}`}>Points</p>
        <p className="mt-2 text-3xl font-semibold">{points.toLocaleString()}</p>
        <p className={`text-xs ${description}`}>Points are rewards you keep</p>
      </div>
    </div>
  );
}
