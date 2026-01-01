"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/shop", label: "Shop", icon: "🛍" },
  { href: "/orders", label: "Orders", icon: "📦" },
  { href: "/wallet", label: "Wallet", icon: "💳" },
  { href: "/profile", label: "Profile", icon: "👤" },
];


export function MobileNav() {
  const pathname = usePathname();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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
              <span className="text-lg" aria-hidden>
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
