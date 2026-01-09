 "use client";

import { useEffect, useRef } from "react";
import { formatMinis } from "@/lib/minis";

interface Props {
  minis?: number;
  tone?: "light" | "dark" | "auto";
}

export function BalancePanel({ minis, tone = "auto" }: Props) {
  const prevMinis = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const valueRef = useRef<HTMLParagraphElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const useAutoTone = tone === "auto";
  const isDark = tone === "dark";
  const current = minis ?? 0;
  const container =
    "rounded-2xl border p-4 transition-colors duration-700 " +
    (useAutoTone
      ? "bg-[color:var(--balance-bg)] text-[color:var(--balance-text-base)] border-[color:var(--balance-border)]"
      : isDark
      ? "border-white/20 bg-white/10 text-white"
      : "border-black/10 bg-white text-black");
  const label = useAutoTone ? "text-[color:var(--balance-label)]" : isDark ? "text-white/60" : "text-gray-500";
  const description = useAutoTone
    ? "text-[color:var(--balance-desc)]"
    : isDark
    ? "text-white/70"
    : "text-gray-500";
  const styleVars = useAutoTone
    ? undefined
    : ({
        "--balance-base": isDark ? "rgba(255, 255, 255, 0.1)" : "#ffffff",
        "--balance-flash-up": isDark ? "rgba(16, 185, 129, 0.4)" : "#ccfbf1",
        "--balance-flash-down": isDark ? "rgba(248, 113, 113, 0.4)" : "#fee2e2",
        "--balance-text-base": isDark ? "#ffffff" : "#0b0b0b",
        "--balance-text-up": isDark ? "#34d399" : "#15803d",
        "--balance-text-down": isDark ? "#fca5a5" : "#b91c1c",
      } as React.CSSProperties);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const valueEl = valueRef.current;
    if (!valueEl) return;
    let from = prevMinis.current;
    if (from === null) {
      const stored = window.sessionStorage.getItem("waashop-minis-balance");
      const parsed = stored ? Number(stored) : NaN;
      from = Number.isFinite(parsed) ? parsed : current;
      prevMinis.current = from;
    }
    if (current === from) {
      valueEl.textContent = formatMinis(current);
      window.sessionStorage.setItem("waashop-minis-balance", String(current));
      return;
    }
    const nextDirection: "up" | "down" = current > (from ?? current) ? "up" : "down";
    prevMinis.current = current;
    window.sessionStorage.setItem("waashop-minis-balance", String(current));
    const containerEl = containerRef.current;
    if (!containerEl || !valueEl) return;
    const containerClass = nextDirection === "up" ? "balance-flash-up" : "balance-flash-down";
    const valueClass = nextDirection === "up" ? "balance-flash-up-text" : "balance-flash-down-text";
    containerEl.classList.remove("balance-flash-up", "balance-flash-down");
    valueEl.classList.remove("balance-flash-up-text", "balance-flash-down-text");
    // Force reflow to restart animation.
    void containerEl.offsetWidth;
    containerEl.classList.add(containerClass);
    valueEl.classList.add(valueClass);

    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
    }
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) {
      valueEl.textContent = formatMinis(current);
      return;
    }
    const startValue = from ?? current;
    const duration = 900;
    const start = window.performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (current - startValue) * eased;
      valueEl.textContent = formatMinis(nextValue);
      if (progress < 1) {
        animationRef.current = window.requestAnimationFrame(step);
      } else {
        animationRef.current = null;
        valueEl.textContent = formatMinis(current);
      }
    };
    animationRef.current = window.requestAnimationFrame(step);
  }, [current]);

  return (
    <div>
      <div ref={containerRef} className={container} style={styleVars}>
        <p className={`text-xs uppercase tracking-[0.3em] ${label}`}>MINIS</p>
        <p
          ref={valueRef}
          className={`mt-2 text-3xl font-semibold transition-colors duration-700 ${
            useAutoTone ? "text-[color:var(--balance-text-base)]" : ""
          }`}
        >
          {formatMinis(current)}
        </p>
        <p className={`text-xs ${description}`}>TOTAL BALANCE</p>
      </div>
    </div>
  );
}
