"use client";

import { useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ShopHeader({
  activeTab,
  initialQuery,
}: {
  activeTab?: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const lastTabRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const tabParam = useMemo(() => {
    if (activeTab) return activeTab;
    return searchParams.get("tab") ?? "";
  }, [activeTab, searchParams]);

  useEffect(() => {
    if (lastTabRef.current === tabParam) return;
    lastTabRef.current = tabParam;
    if (!searchParams.get("q")) return;
    const params = new URLSearchParams(searchParams);
    params.delete("q");
    startTransition(() => {
      router.replace(`/shop?${params.toString()}`, { scroll: false });
    });
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [router, searchParams, startTransition, tabParam]);

  useEffect(() => {
    const handleTabClick = () => {
      if (inputRef.current) inputRef.current.value = "";
    };
    window.addEventListener("waashop:shop-tab", handleTabClick as EventListener);
    return () => window.removeEventListener("waashop:shop-tab", handleTabClick as EventListener);
  }, []);

  const updateQuery = (nextValue: string) => {
    const params = new URLSearchParams(searchParams);
    if (tabParam) params.set("tab", tabParam);
    if (nextValue.trim()) {
      params.set("q", nextValue.trim());
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.replace(`/shop?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Shop</p>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-gray-400">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5">
            <path
              fill="currentColor"
              d="M10.5 3a7.5 7.5 0 1 1 5.3 12.8l3.9 3.9a1 1 0 0 1-1.4 1.4l-3.9-3.9A7.5 7.5 0 0 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11a5.5 5.5 0 0 0 0-11Z"
            />
          </svg>
        </span>
        <input
          type="search"
          ref={inputRef}
          defaultValue={initialQuery ?? ""}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder=""
          aria-label="Search products"
          className="h-7 w-50 rounded-full border border-black/15 bg-white pl-8 pr-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        {isPending && <span className="ml-2 text-[10px] text-gray-400">…</span>}
      </div>
    </div>
  );
}
