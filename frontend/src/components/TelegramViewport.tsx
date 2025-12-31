"use client";

import { useEffect } from "react";

type TelegramWebApp = {
  isExpanded?: boolean;
  expand: () => void;
  ready?: () => void;
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
    const webApp = window.Telegram?.WebApp;
    if (webApp && !webApp.isExpanded) {
      try {
        if (typeof webApp.ready === "function") webApp.ready();
        webApp.expand();
      } catch {
        // ignore
      }
    }
  }, []);

  return null;
}
