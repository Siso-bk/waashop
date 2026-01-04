"use client";

import { useEffect } from "react";

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

export function ThemeInitializer() {
  useEffect(() => {
    const getMode = () =>
      (window.localStorage.getItem("waashop:portal-theme") as ThemeMode | null) || "dark";
    let currentMode = getMode();
    applyTheme(currentMode);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMedia = () => {
      if (currentMode !== "system") return;
      applyTheme("system");
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "waashop:portal-theme") return;
      currentMode = getMode();
      applyTheme(currentMode);
    };

    media.addEventListener("change", handleMedia);
    window.addEventListener("storage", handleStorage);
    return () => {
      media.removeEventListener("change", handleMedia);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}
