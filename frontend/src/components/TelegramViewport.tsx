"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        isExpanded?: boolean;
        expand: () => void;
      };
    };
  }
}

export function TelegramViewport() {
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp && !webApp.isExpanded) {
      try {
        webApp.ready?.();
        webApp.expand();
      } catch {
        // ignore
      }
    }
  }, []);

  return null;
}
