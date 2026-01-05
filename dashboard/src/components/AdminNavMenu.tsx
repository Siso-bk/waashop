"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type AdminNavItem = {
  href: string;
  label: string;
};

export function AdminNavMenu({
  items,
  label,
  showActiveLabel = false,
}: {
  items: AdminNavItem[];
  label: string;
  showActiveLabel?: boolean;
}) {
  const pathname = usePathname();
  const isActiveGroup = items.some((item) => {
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  });
  const baseClass = `rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] transition ${
    isActiveGroup
      ? "border-indigo-600 text-indigo-700"
      : "border-transparent text-slate-500 hover:border-slate-200 hover:text-indigo-600"
  }`;

  if (items.length === 1) {
    return (
      <Link
        href={items[0].href}
        className={baseClass}
      >
        {label}
      </Link>
    );
  }
  const [open, setOpen] = useState(false);
  const activeItem = items.find((item) => pathname.startsWith(item.href));

  if (items.length === 0) return null;

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
        }
      }}
      tabIndex={-1}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${baseClass} ${open ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {showActiveLabel && activeItem ? activeItem.label : label}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 shadow-lg"
        >
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
