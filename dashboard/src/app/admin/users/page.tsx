import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
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
  const { users } = await getAdminUsers();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Users" description="Manage admin/vendor roles." />
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
                  <p className="text-xs text-slate-500">{entry.firstName || entry.lastName ? `${entry.firstName || ""} ${entry.lastName || ""}` : "No profile"}</p>
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
      <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1 text-white">
        Save
      </button>
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
