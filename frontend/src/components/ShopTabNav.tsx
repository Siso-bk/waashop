"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Tab = {
  key: string;
  label: string;
};

type Props = {
  tabs: Tab[];
  activeTab?: string;
  basePath?: string;
};

export function ShopTabNav({ tabs, activeTab, basePath = "/shop" }: Props) {
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [activeTab]);

  return (
    <nav className="relative flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
      {isNavigating && (
        <div className="absolute left-0 right-0 top-0 h-[2px] overflow-hidden rounded-full bg-[color:var(--surface-border)]">
          <div className="h-full w-1/3 animate-nav-progress rounded-full bg-emerald-400" />
        </div>
      )}
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Link
            key={tab.key}
            href={`${basePath}?tab=${tab.key}`}
            onClick={() => {
              if (!isActive) setIsNavigating(true);
            }}
            className={`web-tab whitespace-nowrap px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] transition ${
              isActive ? "web-tab-active" : "hover:opacity-80"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
