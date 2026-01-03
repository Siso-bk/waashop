import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getNotificationsSummary, getOptionalProfile } from "@/lib/queries";
import { PendingButton } from "@/components/PendingButton";

export const metadata: Metadata = {
  title: "Waashop Portal",
  description: "Admin and vendor operations for Waashop",
};

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/deposits", label: "Deposits" },
  { href: "/notifications", label: "Notifications" },
  { href: "/admin/vendors", label: "Admin · Vendors", roles: ["admin"] },
  { href: "/admin/products", label: "Admin · Products", roles: ["admin"] },
  { href: "/admin/home-hero", label: "Admin · Home hero", roles: ["admin"] },
  { href: "/admin/home-highlights", label: "Admin · Home highlights", roles: ["admin"] },
  { href: "/admin/shop-tabs", label: "Admin · Shop tabs", roles: ["admin"] },
  { href: "/admin/orders", label: "Admin · Orders", roles: ["admin"] },
  { href: "/admin/promo-cards", label: "Admin · Promo cards", roles: ["admin"] },
  { href: "/admin/deposits", label: "Admin · Deposits", roles: ["admin"] },
  { href: "/admin/users", label: "Admin · Users", roles: ["admin"] },
  { href: "/admin/winners", label: "Admin · Winners", roles: ["admin"] },
  { href: "/admin/settings", label: "Admin · Settings", roles: ["admin"] },
  { href: "/vendor", label: "Vendor", roles: ["vendor", "admin"] },
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getOptionalProfile();
  const user = profile?.user;
  const roles = user?.roles ?? [];
  const isSignedIn = Boolean(user);
  let unread = 0;
  if (isSignedIn) {
    try {
      const summary = await getNotificationsSummary();
      unread = summary.unread;
    } catch {
      unread = 0;
    }
  }
  const filteredNavItems = isSignedIn
    ? navItems.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        return item.roles.some((role) => roles.includes(role));
      })
    : [];

  return (
    <html lang="en">
      <body className="bg-slate-50 font-sans text-slate-900">
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <Link href="/" className="text-lg font-semibold text-indigo-600">
                Waashop Portal
              </Link>
              <div className="flex flex-1 flex-col items-start gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-end sm:gap-6">
                <nav className="flex flex-wrap gap-4">
                  {filteredNavItems.map((item) => (
                    <Link key={item.href} href={item.href} className="hover:text-indigo-600">
                      {item.label}
                    </Link>
                  ))}
                </nav>
                {isSignedIn ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/notifications"
                      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-base hover:border-indigo-300"
                      aria-label="Notifications"
                    >
                      🔔
                      {unread > 0 && (
                        <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </Link>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {user?.email || user?.username || "Signed in"}
                    </span>
                    <form action={logoutAction}>
                      <PendingButton
                        pendingLabel="Signing out..."
                        className="text-sm text-red-500 hover:text-red-600"
                      >
                        Logout
                      </PendingButton>
                    </form>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}

async function logoutAction() {
  "use server";
  const { cookies } = await import("next/headers");
  const { SESSION_COOKIE } = await import("@/lib/constants");
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
