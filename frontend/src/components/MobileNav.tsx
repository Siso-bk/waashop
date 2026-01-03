"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const navLinks = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/shop", label: "Shop", icon: "🛍" },
  { href: "/info", label: "Info", icon: "ℹ️" },
  { href: "/wallet", label: "Wallet", icon: "💳" },
  { href: "/account", label: "Account", icon: "👤" },
];


export function MobileNav() {
  const pathname = usePathname();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const initialHeight = window.innerHeight;
    const handler = () => {
      setKeyboardVisible(viewport.height < initialHeight * 0.75);
    };
    handler();
    viewport.addEventListener("resize", handler);
    return () => viewport.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;
    const loadUnread = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
          credentials: "include",
        });
        if (!response.ok) return;
        const data = await response.json().catch(() => ({}));
        if (!active || typeof data?.unread !== "number") return;
        setUnreadCount(data.unread);
      } catch {
        // Ignore unread fetch failures for guests.
      }
    };
    if (pathname.startsWith("/info")) {
      setUnreadCount(0);
    } else {
      void loadUnread();
    }
    return () => {
      active = false;
    };
  }, [pathname]);

  if (keyboardVisible) return null;

  return (
    <nav className="fixed bottom-3 left-1/2 z-40 w-[90%] max-w-md -translate-x-1/2 rounded-2xl border border-black/10 bg-white/95 px-2 py-2 shadow-lg shadow-black/10 backdrop-blur md:hidden">
      <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-center ${
                isActive ? "bg-black text-white" : "text-gray-500"
              }`}
              style={{ minWidth: "48px" }}
            >
              <span className="relative text-lg" aria-hidden>
                {link.icon}
                {link.href === "/info" && unreadCount > 0 && (
                  <span className="absolute -right-2 -top-1 min-w-[16px] rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
