"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/shop", label: "Shop", icon: "◎" },
  { href: "/orders", label: "Orders", icon: "✦" },
  { href: "/wallet", label: "Wallet", icon: "₿" },
  { href: "/profile", label: "Profile", icon: "☺" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-3 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-3xl border border-black/10 bg-white/95 p-3 shadow-lg shadow-black/10 backdrop-blur md:hidden">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center gap-1 px-2 py-2 text-center ${
                isActive ? "text-black" : "text-gray-500"
              }`}
              style={{ minWidth: "56px" }}
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
