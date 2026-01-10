import Link from "next/link";
import { getSessionUser } from "@/lib/queries";

export default async function AccountPage() {
  const user = await getSessionUser();
  const roles = user?.roles ?? [];
  const isVendor = roles.includes("vendor");
  const vendorPortalHref = "/vendor";

  if (!user) {
    return (
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-600">Sign in to manage your account.</p>
        <p className="text-xs text-gray-500">Use your email or username@pai.</p>
        <Link
          href="/login?redirect=/account"
          className="inline-flex rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Account</p>
        <h1 className="text-2xl font-semibold text-black">Wallet & account</h1>
        <p className="text-sm text-gray-600">Balance, profile details, security, and preferences.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/wallet"
          className="group rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-black/30 hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Wallet</p>
          <h2 className="mt-2 text-lg font-semibold text-black">Balance & activity</h2>
          <p className="mt-2 text-sm text-gray-600">Send, receive, deposit, and withdraw MINIS.</p>
          <span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.3em] text-black">
            Open
          </span>
        </Link>
        <Link
          href="/profile"
          className="group rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-black/30 hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Profile</p>
          <h2 className="mt-2 text-lg font-semibold text-black">Account management</h2>
          <p className="mt-2 text-sm text-gray-600">Update name, handle, and account identity.</p>
          <span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.3em] text-black">
            Open
          </span>
        </Link>
        <Link
          href="/settings"
          className="group rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-black/30 hover:shadow-md"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Settings</p>
          <h2 className="mt-2 text-lg font-semibold text-black">Security & actions</h2>
          <p className="mt-2 text-sm text-gray-600">Log out, delete account, and preferences.</p>
          <span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.3em] text-black">
            Open
          </span>
        </Link>
        {isVendor && (
          <Link
            href={vendorPortalHref}
            className="group rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-black/30 hover:shadow-md"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Vendor</p>
            <h2 className="mt-2 text-lg font-semibold text-black">Vendor dashboard</h2>
            <p className="mt-2 text-sm text-gray-600">Post products, mystery boxes, and challenges.</p>
            <span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.3em] text-black">
              Open
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
