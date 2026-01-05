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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("waashop:portal-theme") as ThemeMode | null;
    setThemeMode(stored || "dark");
  }, []);

  useEffect(() => {
    applyTheme(themeMode);
    window.localStorage.setItem("waashop:portal-theme", themeMode);
  }, [themeMode]);

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
        }
      }}
      tabIndex={-1}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-base text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Theme"
      >
        {themeMode === "dark" ? "🌙" : themeMode === "light" ? "☀️" : "🖥️"}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 rounded-2xl border border-slate-200 bg-white p-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-lg"
        >
          {(["dark", "light", "system"] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setThemeMode(mode);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 transition ${
                themeMode === mode ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 hover:text-indigo-600"
              }`}
            >
              <span>{mode}</span>
              <span>{mode === "dark" ? "🌙" : mode === "light" ? "☀️" : "🖥️"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
