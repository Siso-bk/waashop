"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ShopHeader({
  activeTab,
  initialQuery,
  suggestions = [],
  basePath = "/shop",
  label = "Shop",
}: {
  activeTab?: string;
  initialQuery?: string;
  suggestions?: string[];
  basePath?: string;
  label?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const lastTabRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const tabParam = useMemo(() => {
    if (activeTab) return activeTab;
    return searchParams.get("tab") ?? "";
  }, [activeTab, searchParams]);
  const currentQuery = useMemo(() => {
    const live = searchParams.get("q");
    return typeof live === "string" ? live : initialQuery ?? "";
  }, [initialQuery, searchParams]);

  useEffect(() => {
    if (lastTabRef.current === tabParam) return;
    lastTabRef.current = tabParam;
    if (!searchParams.get("q")) return;
    const params = new URLSearchParams(searchParams);
    params.delete("q");
    startTransition(() => {
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    });
  }, [basePath, router, searchParams, startTransition, tabParam]);


  const updateQuery = (nextValue: string) => {
    const params = new URLSearchParams(searchParams);
    if (tabParam) params.set("tab", tabParam);
    if (nextValue.trim()) {
      params.set("q", nextValue.trim());
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    });
  };

  const parseRecent = (raw: string | null) => {
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const readCurrent = () => {
      setRecentSearches(parseRecent(window.localStorage.getItem("waashop-recent-searches")));
    };
    readCurrent();
    const handler = () => readCurrent();
    window.addEventListener("storage", handler);
    window.addEventListener("recent-searches:updated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("recent-searches:updated", handler);
    };
  }, []);

  const commitSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    updateQuery(trimmed);
    if (typeof window === "undefined") return;
    const existing = parseRecent(window.localStorage.getItem("waashop-recent-searches")).filter((item) => item !== trimmed);
    const next = [trimmed, ...existing].slice(0, 6);
    window.localStorage.setItem("waashop-recent-searches", JSON.stringify(next));
    window.dispatchEvent(new Event("recent-searches:updated"));
  };

  const filteredSuggestions = useMemo(() => {
    const trimmed = currentQuery.trim().toLowerCase();
    if (!trimmed) return [];
    return suggestions
      .filter((item) => item.toLowerCase().includes(trimmed))
      .slice(0, 6);
  }, [currentQuery, suggestions]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="web-kicker">{label}</p>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-[color:var(--app-text-muted)]">
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
          value={currentQuery}
          onChange={(event) => updateQuery(event.target.value)}
          onFocus={() => {
            if (closeTimerRef.current !== null) {
              window.clearTimeout(closeTimerRef.current);
              closeTimerRef.current = null;
            }
            setOpen(true);
          }}
          onBlur={() => {
            closeTimerRef.current = window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitSearch(currentQuery);
              setOpen(false);
            }
          }}
          placeholder=""
          aria-label="Search products"
          className="h-7 w-50 rounded-full border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] pl-9 pr-3 text-[11px] text-[color:var(--app-text)] placeholder:text-[color:var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/30"
        />
        {isPending && <span className="ml-2 text-[10px] text-[color:var(--app-text-muted)]">…</span>}
        {open && (recentSearches.length > 0 || filteredSuggestions.length > 0) && (
          <div className="web-panel absolute left-0 top-full z-10 mt-2 w-[220px] rounded-2xl p-2 text-[11px]">
            {recentSearches.length > 0 && (
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--app-text-muted)]">
                  Recent
                </p>
                {recentSearches.map((item) => (
                  <button
                    key={`recent-${item}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      commitSearch(item);
                      setOpen(false);
                    }}
                    className="block w-full rounded-xl px-2 py-1.5 text-left text-[color:var(--app-text)] hover:bg-[color:var(--surface-bg)]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
            {filteredSuggestions.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--app-text-muted)]">
                  Suggestions
                </p>
                {filteredSuggestions.map((item) => (
                  <button
                    key={`suggest-${item}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      commitSearch(item);
                      setOpen(false);
                    }}
                    className="block w-full rounded-xl px-2 py-1.5 text-left text-[color:var(--app-text)] hover:bg-[color:var(--surface-bg)]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
