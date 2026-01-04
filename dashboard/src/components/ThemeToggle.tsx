"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const applyTheme = (mode: ThemeMode) => {
  if (typeof document === "undefined") return;
  if (mode === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
    return;
  }
  document.documentElement.dataset.theme = mode;
};

export function ThemeToggle() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("waashop:portal-theme") as ThemeMode | null;
    setThemeMode(stored || "dark");
  }, []);

  useEffect(() => {
    applyTheme(themeMode);
    window.localStorage.setItem("waashop:portal-theme", themeMode);
  }, [themeMode]);

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/70 p-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
      {(["dark", "light", "system"] as ThemeMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setThemeMode(mode)}
          className={`rounded-full px-2.5 py-1 transition ${
            themeMode === mode ? "bg-indigo-600 text-white" : "hover:text-indigo-600"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
