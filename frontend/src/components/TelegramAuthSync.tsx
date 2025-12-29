"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/constants";

const STORAGE_KEY = "waashop:lastTelegramInitData";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type TelegramWindow = typeof window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
      ready?: () => void;
      expand?: () => void;
    };
  };
};

export function TelegramAuthSync() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const syncAuth = useCallback(async () => {
    if (typeof window === "undefined") return;
    const tg = (window as TelegramWindow).Telegram?.WebApp;
    if (!tg?.initData) return;

    const initData = tg.initData as string;
    const lastSynced = sessionStorage.getItem(STORAGE_KEY);
    if (lastSynced === initData) {
      return;
    }

    try {
      setError(null);
      tg.ready?.();
      tg.expand?.();
      if (!API_BASE_URL) {
        throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });

      if (!response.ok) {
        throw new Error("Auth failed");
      }

      const data = await response.json();
      const token: string | undefined = data.token;
      if (token) {
        const secure = window.location.protocol === "https:" ? "Secure;" : "";
        document.cookie = `${SESSION_COOKIE}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; ${secure} SameSite=Lax`;
      }

      sessionStorage.setItem(STORAGE_KEY, initData);
      router.refresh();
    } catch (err) {
      console.error("Telegram auth sync failed", err);
      setError("Unable to connect to Telegram. Tap to retry.");
    }
  }, [router]);

  useEffect(() => {
    syncAuth();
  }, [syncAuth, attempt]);

  const handleRetry = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setAttempt((prev) => prev + 1);
  };

  if (!error) return null;

  return (
    <div className="fixed bottom-4 right-4 z-30 max-w-xs rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-600 shadow-lg">
      <p>{error}</p>
      <button
        onClick={handleRetry}
        className="mt-2 w-full rounded-full bg-red-500 px-3 py-1 text-white"
      >
        Retry Telegram Sync
      </button>
    </div>
  );
}
