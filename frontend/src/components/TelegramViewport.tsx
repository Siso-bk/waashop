"use client";

import { useEffect } from "react";

type TelegramWebApp = {
  isExpanded?: boolean;
  expand: () => void;
  ready?: () => void;
  requestFullscreen?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  viewportHeight?: number;
  viewportStableHeight?: number;
  onEvent?: (event: string, cb: () => void) => void;
  offEvent?: (event: string, cb: () => void) => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function TelegramViewport() {
  useEffect(() => {
    const syncViewportVars = (webApp?: TelegramWebApp) => {
      const height = webApp?.viewportHeight || window.innerHeight;
      const stableHeight = webApp?.viewportStableHeight || height;
      document.documentElement.style.setProperty("--tg-viewport-height", `${height}px`);
      document.documentElement.style.setProperty("--tg-viewport-stable-height", `${stableHeight}px`);
    };
    const handleViewportChange = () => syncViewportVars(window.Telegram?.WebApp);

    const attemptExpand = () => {
      const webApp = window.Telegram?.WebApp;
      if (!webApp) {
        return false;
      }
      try {
        if (typeof webApp.ready === "function") {
          webApp.ready();
        }
        syncViewportVars(webApp);
        if (typeof webApp.setHeaderColor === "function") {
          webApp.setHeaderColor("#ffffff");
        }
        if (typeof webApp.setBackgroundColor === "function") {
          webApp.setBackgroundColor("#f5f5f2");
        }
        if (typeof webApp.expand === "function" && !webApp.isExpanded) {
          webApp.expand();
        }
        if (typeof webApp.requestFullscreen === "function") {
          webApp.requestFullscreen();
        }
        if (typeof webApp.onEvent === "function") {
          webApp.onEvent("viewportChanged", handleViewportChange);
        }
      } catch {
        // ignore failures; Telegram prevents errors from bubbling to UI
      }
      return true;
    };

    if (attemptExpand()) {
      return;
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (attemptExpand() || attempts > 20) {
        clearInterval(interval);
      }
    }, 150);

    return () => {
      clearInterval(interval);
      const webApp = window.Telegram?.WebApp;
      if (webApp && typeof webApp.offEvent === "function") {
        webApp.offEvent("viewportChanged", handleViewportChange);
      }
    };
  }, []);

  return null;
}
