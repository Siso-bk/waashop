"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  enabled?: boolean;
  intervalMs?: number;
};

export function JackpotAutoRefresh({ enabled = true, intervalMs = 12000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return undefined;
    let timer: number | undefined;

    const tick = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    timer = window.setInterval(tick, intervalMs);
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [enabled, intervalMs, router]);

  return null;
}
