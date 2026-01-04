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
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M16.5 16.5L21 21"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
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
          className="h-7 w-50 rounded-full border border-black/15 bg-white pl-9 pr-3 text-[11px] text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20"
        />
        {isPending && <span className="ml-2 text-[10px] text-gray-400">…</span>}
      </div>
    </div>
  );
}
