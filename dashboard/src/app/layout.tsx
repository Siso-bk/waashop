import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getNotificationsSummary, getOptionalProfile } from "@/lib/queries";
import { PendingButton } from "@/components/PendingButton";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminNavMenu } from "@/components/AdminNavMenu";

export const metadata: Metadata = {
  title: "Waashop Portal",
  description: "Admin and vendor operations for Waashop",
};

const navItems = [{ href: "/", label: "Overview" }];

const accountNavItems = [
  { href: "/account", label: "Profile" },
  { href: "/minis", label: "Minis" },
  { href: "/deposits", label: "Deposits" },
  { href: "/notifications", label: "Notifications" },
  { href: "/vendor", label: "Vendor", roles: ["vendor", "admin"] },
];

const adminNavItems = [
  { href: "/admin/users", label: "Users", roles: ["admin"] },
  { href: "/admin/products", label: "Products", roles: ["admin"] },
  { href: "/admin/orders", label: "Orders", roles: ["admin"] },
  { href: "/admin/vendors", label: "Vendors", roles: ["admin"] },
  { href: "/admin/home-hero", label: "Home hero", roles: ["admin"] },
  { href: "/admin/home-highlights", label: "Home highlights", roles: ["admin"] },
  { href: "/admin/shop-tabs", label: "Shop tabs", roles: ["admin"] },
  { href: "/admin/promo-cards", label: "Promo cards", roles: ["admin"] },
  { href: "/admin/deposits", label: "Deposits", roles: ["admin"] },
  { href: "/admin/transfers", label: "Transfers", roles: ["admin"] },
  { href: "/admin/withdrawals", label: "Withdrawals", roles: ["admin"] },
  { href: "/admin/winners", label: "Winners", roles: ["admin"] },
  { href: "/admin/settings", label: "Settings", roles: ["admin"] },
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
  const overviewNavItems = navItems;
  const accountItems = isSignedIn
    ? accountNavItems.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        return item.roles.some((role) => roles.includes(role));
      })
    : [];
  const adminLinks = isSignedIn && roles.includes("admin") ? adminNavItems : [];

  return (
    <html lang="en">
      <body className="portal-theme font-sans text-slate-900">
        <div className="min-h-screen">
          <ThemeInitializer />
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/" className="text-lg font-semibold text-indigo-600">
                  Waashop Portal
                </Link>
                {roles.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {roles.slice(0, 3).map((role) => (
                      <span key={role} className="rounded-full border border-slate-200 px-2 py-1">
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col items-start gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex flex-wrap items-center gap-3">
                  {overviewNavItems.length > 0 && (
                    <AdminNavMenu label="Overview" items={overviewNavItems.map(({ href, label }) => ({ href, label }))} />
                  )}
                  {accountItems.length > 0 && (
                    <AdminNavMenu label="Account" items={accountItems.map(({ href, label }) => ({ href, label }))} />
                  )}
                  {adminLinks.length > 0 && (
                    <AdminNavMenu label="Admin" items={adminLinks.map(({ href, label }) => ({ href, label }))} />
                  )}
                </div>
                <ThemeToggle />
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
