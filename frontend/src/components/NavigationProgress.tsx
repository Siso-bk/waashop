"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (`${url.pathname}${url.search}${url.hash}` === `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        return;
      }
      setIsNavigating(true);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsNavigating(false);
        timeoutRef.current = null;
      }, 8000);
    };
    const handleProgrammatic = () => {
      setIsNavigating(true);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setIsNavigating(false);
        timeoutRef.current = null;
      }, 8000);
    };
    document.addEventListener("click", handleClick);
    window.addEventListener("waashop:navigation-start", handleProgrammatic);
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("waashop:navigation-start", handleProgrammatic);
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-[var(--surface-border)]">
      <div className="h-full w-1/3 animate-nav-progress bg-emerald-400" />
    </div>
  );
}
