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
    const attemptExpand = () => {
      const webApp = window.Telegram?.WebApp;
      if (!webApp) {
        return false;
      }
      try {
        if (typeof webApp.ready === "function") {
          webApp.ready();
        }
        if (typeof webApp.expand === "function" && !webApp.isExpanded) {
          webApp.expand();
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

    return () => clearInterval(interval);
  }, []);

  return null;
}
