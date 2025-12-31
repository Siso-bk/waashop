"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/orders", label: "Orders" },
  { href: "/wallet", label: "Wallet" },
  { href: "/profile", label: "Profile" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white/90 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-4 py-3 text-xs font-semibold text-gray-500">
        {navLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 ${
                isActive ? "text-black" : "text-gray-500"
              }`}
            >
              <span
                className={`h-1 w-6 rounded-full ${
                  isActive ? "bg-black" : "bg-transparent"
                }`}
                aria-hidden
              />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
