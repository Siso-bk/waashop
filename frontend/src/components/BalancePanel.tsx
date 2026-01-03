 "use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { formatMinis } from "@/lib/minis";

interface Props {
  minis?: number;
  tone?: "light" | "dark" | "auto";
}

export function BalancePanel({ minis, tone = "auto" }: Props) {
  const prevMinis = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const valueRef = useRef<HTMLParagraphElement | null>(null);
  const themeTone = useSyncExternalStore(
    (callback) => {
      if (typeof document === "undefined") return () => {};
      const observer = new MutationObserver(callback);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      return () => observer.disconnect();
    },
    () => (typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light"),
    () => "light"
  );
  const isDark = tone === "dark" || (tone === "auto" && themeTone === "dark");
  const current = minis ?? 0;
  const containerBase =
    "rounded-2xl p-4 transition-colors duration-700" +
    (isDark
      ? " border border-white/20 bg-white/10 text-white"
      : " border border-black/10 bg-white text-black");
  const container = containerBase;
  const label = isDark ? "text-white/60" : "text-gray-500";
  const description = isDark ? "text-white/70" : "text-gray-500";
  const styleVars = {
    "--balance-base": isDark ? "rgba(255, 255, 255, 0.1)" : "#ffffff",
    "--balance-flash-up": isDark ? "rgba(16, 185, 129, 0.4)" : "#ccfbf1",
    "--balance-flash-down": isDark ? "rgba(248, 113, 113, 0.4)" : "#fee2e2",
    "--balance-text-base": isDark ? "#ffffff" : "#0b0b0b",
    "--balance-text-up": "#15803d",
    "--balance-text-down": "#b91c1c",
  } as React.CSSProperties;

  useEffect(() => {
    if (typeof window === "undefined" || prevMinis.current !== null) return;
    const stored = window.sessionStorage.getItem("waashop-minis-balance");
    const parsed = stored ? Number(stored) : NaN;
    if (Number.isFinite(parsed)) {
      prevMinis.current = parsed;
    }
  }, []);

  useEffect(() => {
    if (prevMinis.current === null) {
      prevMinis.current = current;
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("waashop-minis-balance", String(current));
      }
      return;
    }
    if (current === prevMinis.current) return;
    const nextDirection: "up" | "down" = current > prevMinis.current ? "up" : "down";
    prevMinis.current = current;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("waashop-minis-balance", String(current));
    }
    const containerEl = containerRef.current;
    const valueEl = valueRef.current;
    if (!containerEl || !valueEl) return;
    const containerClass = nextDirection === "up" ? "balance-flash-up" : "balance-flash-down";
    const valueClass = nextDirection === "up" ? "balance-flash-up-text" : "balance-flash-down-text";
    containerEl.classList.remove("balance-flash-up", "balance-flash-down");
    valueEl.classList.remove("balance-flash-up-text", "balance-flash-down-text");
    // Force reflow to restart animation.
    void containerEl.offsetWidth;
    containerEl.classList.add(containerClass);
    valueEl.classList.add(valueClass);
  }, [current]);

  return (
    <div>
      <div ref={containerRef} className={container} style={styleVars}>
        <p className={`text-xs uppercase tracking-[0.3em] ${label}`}>MINIS</p>
        <p ref={valueRef} className="mt-2 text-3xl font-semibold transition-colors duration-700">
          {formatMinis(current)}
        </p>
        <p className={`text-xs ${description}`}>TOTAL BALANCE</p>
      </div>
    </div>
  );
}
