import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getProfile } from "@/lib/queries";
import { requireToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  await requireToken();
  const { user } = await getProfile();
  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.firstName || user.lastName ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Profile";
  const isAdmin = user.roles.includes("admin");
  const isVendor = user.roles.includes("vendor");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Account" title={displayName} description="Profile details and account shortcuts." />
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
          <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Email</dt>
              <dd className="mt-1 font-medium text-slate-900">{user.email || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Username</dt>
              <dd className="mt-1 font-medium text-slate-900">{user.username || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Roles</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <span key={role} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {role}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Minis balance</dt>
              <dd className="mt-1 font-medium text-slate-900">{user.minisBalance.toLocaleString()} MINIS</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Account shortcuts</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Link
              href="/notifications"
              className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
            >
              <span>Notifications</span>
              <span className="text-xs text-slate-400">View updates</span>
            </Link>
            <Link
              href="/minis"
              className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
            >
              <span>Minis overview</span>
              <span className="text-xs text-slate-400">Ledger & balances</span>
            </Link>
            {isVendor && (
              <Link
                href="/vendor"
                className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
              >
                <span>Vendor dashboard</span>
                <span className="text-xs text-slate-400">Manage listings</span>
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin/settings"
                className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
              >
                <span>Platform settings</span>
                <span className="text-xs text-slate-400">Fees & policies</span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
