"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

export function PortalNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] transition ${
              isActive
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                : "border border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
