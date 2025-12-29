import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waashop Portal",
  description: "Admin and vendor operations for Waashop",
};

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/admin/vendors", label: "Admin · Vendors" },
  { href: "/admin/products", label: "Admin · Products" },
  { href: "/vendor", label: "Vendor" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 font-sans text-slate-900">
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8">
              <Link href="/" className="text-lg font-semibold text-indigo-600">
                Waashop Portal
              </Link>
              <nav className="flex flex-wrap gap-4 text-sm text-slate-600">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="hover:text-indigo-600">
                    {item.label}
                  </Link>
                ))}
                <form action={logoutAction}>
                  <button className="text-sm text-red-500 hover:text-red-600" type="submit">
                    Logout
                  </button>
                </form>
              </nav>
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
