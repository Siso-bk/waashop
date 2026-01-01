import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PendingButton } from "@/components/PendingButton";
import { getAdminUsers, getProfile } from "@/lib/queries";
import { backendFetch } from "@/lib/backendClient";
import { requireToken } from "@/lib/session";
import type { AdminUser } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Users" description="Manage admin/vendor roles." />
      <Suspense fallback={<UsersSkeleton />}>
        <UsersTable />
      </Suspense>
    </div>
  );
}

async function UsersTable() {
  const { users } = await getAdminUsers();
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Roles</th>
            <th className="px-4 py-3">Balances</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((entry) => (
            <tr key={entry.id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{entry.email || entry.username || entry.id}</p>
                <p className="text-xs text-slate-500">
                  {entry.firstName || entry.lastName ? `${entry.firstName || ""} ${entry.lastName || ""}` : "No profile"}
                </p>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {entry.roles.map((role) => (
                    <StatusBadge key={role} status={role} />
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                <p>Coins: {entry.coinsBalance.toLocaleString()}</p>
                <p>Points: {entry.pointsBalance.toLocaleString()}</p>
              </td>
              <td className="px-4 py-3">
                <RoleForm user={entry} />
                <BalanceAdjustForm user={entry} />
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                No users yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Roles</th>
            <th className="px-4 py-3">Balances</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, idx) => (
            <tr key={idx} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
                <div className="mt-2 h-3 w-24 rounded bg-slate-100 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-24 rounded-full bg-slate-100 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-3 w-32 rounded bg-slate-200 animate-pulse" />
                <div className="mt-1 h-3 w-24 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-10 w-36 rounded bg-slate-100 animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleForm({ user }: { user: AdminUser }) {
  return (
    <form action={updateRoles} className="flex flex-wrap gap-2 text-xs">
      <input type="hidden" name="userId" value={user.id} />
      <label className="flex items-center gap-1">
        <input type="checkbox" name="role-customer" defaultChecked={user.roles.includes("customer")} /> Customer
      </label>
      <label className="flex items-center gap-1">
        <input type="checkbox" name="role-vendor" defaultChecked={user.roles.includes("vendor")} /> Vendor
      </label>
      <label className="flex items-center gap-1">
        <input type="checkbox" name="role-admin" defaultChecked={user.roles.includes("admin")} /> Admin
      </label>
      <PendingButton pendingLabel="Saving..." className="rounded-lg bg-indigo-600 px-3 py-1 text-white">
        Save
      </PendingButton>
    </form>
  );
}

async function updateRoles(formData: FormData) {
  "use server";
  const userId = formData.get("userId");
  if (!userId || typeof userId !== "string") {
    return;
  }
  const roles: string[] = [];
  if (formData.get("role-customer") === "on") roles.push("customer");
  if (formData.get("role-vendor") === "on") roles.push("vendor");
  if (formData.get("role-admin") === "on") roles.push("admin");
  if (roles.length === 0) roles.push("customer");
  await backendFetch(`/api/admin/users/${userId}/roles`, {
    method: "PATCH",
    body: JSON.stringify({ roles }),
  });
  revalidatePath("/admin/users");
}

function BalanceAdjustForm({ user }: { user: AdminUser }) {
  return (
    <form action={adjustBalances} className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
      <input type="hidden" name="userId" value={user.id} />
      <input type="number" name="coinsDelta" step="1" placeholder="+/- coins" className="w-28 rounded-lg border border-slate-200 px-2 py-1" />
      <input type="number" name="pointsDelta" step="1" placeholder="+/- points" className="w-28 rounded-lg border border-slate-200 px-2 py-1" />
      <input type="text" name="note" placeholder="Optional note" className="w-32 flex-1 rounded-lg border border-slate-200 px-2 py-1" />
      <PendingButton pendingLabel="Updating..." className="rounded-lg bg-slate-900 px-3 py-1.5 font-semibold text-white">
        Adjust
      </PendingButton>
    </form>
  );
}

async function adjustBalances(formData: FormData) {
  "use server";
  const userId = formData.get("userId");
  if (!userId || typeof userId !== "string") {
    return;
  }
  const coinsDeltaRaw = formData.get("coinsDelta");
  const pointsDeltaRaw = formData.get("pointsDelta");
  const coinsDelta = typeof coinsDeltaRaw === "string" && coinsDeltaRaw.trim() !== "" ? Number(coinsDeltaRaw) : 0;
  const pointsDelta =
    typeof pointsDeltaRaw === "string" && pointsDeltaRaw.trim() !== "" ? Number(pointsDeltaRaw) : 0;
  const noteRaw = formData.get("note");
  const note = typeof noteRaw === "string" && noteRaw.trim().length > 0 ? noteRaw.trim() : undefined;

  if (!Number.isFinite(coinsDelta) || !Number.isFinite(pointsDelta)) {
    return;
  }
  if (coinsDelta === 0 && pointsDelta === 0) {
    return;
  }

  await backendFetch("/api/admin/ledger/adjust", {
    method: "POST",
    body: JSON.stringify({ userId, coinsDelta, pointsDelta, note }),
  });
  revalidatePath("/admin/users");
}
