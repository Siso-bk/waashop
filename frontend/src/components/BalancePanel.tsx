 "use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  minis?: number;
  tone?: "light" | "dark";
}

export function BalancePanel({ minis, tone = "light" }: Props) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevMinis = useRef<number | null>(null);
  const isDark = tone === "dark";
  const containerBase =
    "rounded-2xl p-4 transition-colors duration-700" +
    (isDark
      ? " border border-white/20 bg-white/10 text-white"
      : " border border-black/10 bg-white text-black");
  const containerFlash =
    flash === "up"
      ? isDark
        ? " bg-emerald-500/15"
        : " bg-emerald-50"
      : flash === "down"
      ? isDark
        ? " bg-red-500/15"
        : " bg-red-50"
      : "";
  const container = `${containerBase}${containerFlash ? ` ${containerFlash}` : ""}`;
  const label = isDark ? "text-white/60" : "text-gray-500";
  const description = isDark ? "text-white/70" : "text-gray-500";
  const valueFlash =
    flash === "up"
      ? "text-emerald-600"
      : flash === "down"
      ? "text-red-600"
      : "";

  useEffect(() => {
    const current = minis ?? 0;
    if (prevMinis.current === null) {
      prevMinis.current = current;
      return;
    }
    if (current === prevMinis.current) return;
    const direction: "up" | "down" = current > prevMinis.current ? "up" : "down";
    prevMinis.current = current;
    let clearTimer: number | undefined;
    const activateTimer = window.setTimeout(() => {
      setFlash(direction);
      clearTimer = window.setTimeout(() => setFlash(null), 900);
    }, 0);
    return () => {
      if (activateTimer) clearTimeout(activateTimer);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, [minis]);

  return (
    <div>
      <div className={container}>
        <p className={`text-xs uppercase tracking-[0.3em] ${label}`}>MINIS</p>
        <p className={`mt-2 text-3xl font-semibold transition-colors duration-700 ${valueFlash} ${flash ? "animate-pulse" : ""}`}>
          {(minis ?? 0).toLocaleString()}
        </p>
        <p className={`text-xs ${description}`}>TOTAL BALANCE</p>
      </div>
    </div>
  );
}
