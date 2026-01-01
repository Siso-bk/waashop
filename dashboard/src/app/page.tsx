import Link from "next/link";
import { getProfile } from "@/lib/queries";
import { requireToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  await requireToken();
  const { user, vendor } = await getProfile();
  const isAdmin = user.roles?.includes("admin");

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-700 p-8 text-white shadow-lg">
        <p className="text-sm uppercase text-white/70">Welcome</p>
        <h1 className="text-3xl font-semibold">{user.firstName ? `Hey, ${user.firstName}!` : "Waashop Portal"}</h1>
        <p className="mt-2 text-sm text-white/80">
          Manage vendors, approve products, and keep mystery boxes fair and profitable.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          {isAdmin && (
            <Link href="/admin/vendors" className="rounded-full bg-white/20 px-4 py-2">
              Review Vendors
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/products" className="rounded-full bg-white/20 px-4 py-2">
              Review Products
            </Link>
          )}
          <Link href="/vendor" className="rounded-full bg-white/20 px-4 py-2">
            Vendor Workspace
          </Link>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500">Account</h2>
          <p className="mt-2 text-xl font-semibold text-slate-900">{user.username || user.telegramId}</p>
          <p className="text-sm text-slate-500">Roles: {user.roles.join(", ")}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Coins</p>
              <p className="text-2xl font-semibold text-indigo-600">{user.coinsBalance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-slate-500">Points</p>
              <p className="text-2xl font-semibold text-emerald-600">{user.pointsBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500">Vendor Status</h2>
          {vendor ? (
            <div className="mt-2 space-y-2">
              <p className="text-xl font-semibold text-slate-900">{vendor.name}</p>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusClass(vendor.status)}`}>
                {vendor.status}
              </span>
              <p className="text-sm text-slate-500">{vendor.description || "No description"}</p>
              <Link href="/vendor" className="text-sm font-semibold text-indigo-600">
                Manage vendor profile
              </Link>
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500">
              <p>No vendor profile submitted.</p>
              <Link href="/vendor" className="text-sm font-semibold text-indigo-600">
                Create vendor profile
              </Link>
            </div>
          )}
        </div>
      </div>

      {isAdmin ? (
        <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-indigo-600">Admin Quick Actions</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Link href="/admin/vendors" className="rounded-xl border border-slate-200 p-4 hover:border-indigo-300">
              <p className="text-lg font-semibold text-slate-900">Review vendor applications</p>
              <p className="text-sm text-slate-500">Approve or suspend vendor accounts.</p>
            </Link>
            <Link href="/admin/products" className="rounded-xl border border-slate-200 p-4 hover:border-indigo-300">
              <p className="text-lg font-semibold text-slate-900">Moderate mystery boxes</p>
              <p className="text-sm text-slate-500">Activate/deactivate vendor products.</p>
            </Link>
            <Link href="/admin/home-hero" className="rounded-xl border border-slate-200 p-4 hover:border-indigo-300">
              <p className="text-lg font-semibold text-slate-900">Edit homepage hero</p>
              <p className="text-sm text-slate-500">Update copy and CTAs without redeploying.</p>
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-amber-600">Admin approval required</h2>
          <p className="mt-2 text-sm text-slate-600">
            Vendors must be approved by the platform admin. Complete your profile and wait for review.
          </p>
        </div>
      )}
    </div>
  );
}

const statusClass = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "SUSPENDED":
    case "REJECTED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};
