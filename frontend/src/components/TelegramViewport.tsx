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
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
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
    const handleViewportChange = () => {
      const webApp = window.Telegram?.WebApp;
      syncViewportVars(webApp);
      if (!webApp) return;
      if (typeof webApp.expand === "function" && !webApp.isExpanded) {
        webApp.expand();
      }
      if (typeof webApp.requestFullscreen === "function") {
        webApp.requestFullscreen();
      }
      if (typeof webApp.disableVerticalSwipes === "function") {
        webApp.disableVerticalSwipes();
      }
    };

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
        if (typeof webApp.disableVerticalSwipes === "function") {
          webApp.disableVerticalSwipes();
        }
        if (typeof webApp.enableClosingConfirmation === "function") {
          webApp.enableClosingConfirmation();
        }
        if (typeof webApp.onEvent === "function") {
          webApp.onEvent("viewportChanged", handleViewportChange);
        }
      } catch {
        // ignore failures; Telegram prevents errors from bubbling to UI
      }
      return true;
    };

    const handleUserGesture = () => {
      attemptExpand();
    };
    window.addEventListener("pointerdown", handleUserGesture, { passive: true });
    window.addEventListener("touchstart", handleUserGesture, { passive: true });

    let startY = 0;
    const handleTouchStart = (event: TouchEvent) => {
      startY = event.touches[0]?.clientY ?? 0;
    };
    const handleTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = currentY - startY;
      const scrollEl = document.scrollingElement || document.documentElement;
      if (delta > 0 && scrollEl.scrollTop <= 0) {
        event.preventDefault();
      }
    };
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    if (attemptExpand()) {
      return () => {
        window.removeEventListener("pointerdown", handleUserGesture);
        window.removeEventListener("touchstart", handleUserGesture);
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchmove", handleTouchMove);
      };
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
      window.removeEventListener("pointerdown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return null;
}
