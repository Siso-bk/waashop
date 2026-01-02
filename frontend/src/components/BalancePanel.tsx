interface Props {
  minis?: number;
  tone?: "light" | "dark";
}

export function BalancePanel({ minis, tone = "light" }: Props) {
  const isDark = tone === "dark";
  const container =
    "rounded-2xl p-4" +
    (isDark
      ? " border border-white/20 bg-white/10 text-white"
      : " border border-black/10 bg-white text-black");
  const label = isDark ? "text-white/60" : "text-gray-500";
  const description = isDark ? "text-white/70" : "text-gray-500";

  return (
    <div>
      <div className={container}>
        <p className={`text-xs uppercase tracking-[0.3em] ${label}`}>MIN</p>
        <p className="mt-2 text-3xl font-semibold">{(minis ?? 0).toLocaleString()}</p>
        <p className={`text-xs ${description}`}>Spend MIN to open boxes</p>
      </div>
    </div>
  );
}
