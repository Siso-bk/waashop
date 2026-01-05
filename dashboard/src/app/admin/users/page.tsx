import { Suspense } from "react";
import { CopyActions } from "./CopyActions";
import Link from "next/link";
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

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const plainParams = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>;
  const page = Number(
    typeof plainParams.page === "string" ? plainParams.page : Array.isArray(plainParams.page) ? plainParams.page[0] : 1
  );
  const limit = Number(
    typeof plainParams.limit === "string" ? plainParams.limit : Array.isArray(plainParams.limit) ? plainParams.limit[0] : 20
  );
  const q = typeof plainParams.q === "string" ? plainParams.q.trim() : "";
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Users" description="Manage roles and balance adjustments." />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form method="GET" className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-2.5 text-xs text-slate-400">🔎</span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search users"
                className="w-60 rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm"
              />
            </div>
            <select
              name="limit"
              defaultValue={Number.isFinite(limit) && limit > 0 ? limit : 20}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {[20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Search</button>
          </form>
          <p className="text-xs text-slate-500">Search by email, username, or name.</p>
        </div>
      </div>
      <Suspense fallback={<UsersSkeleton />}>
        <UsersTable
          page={Number.isFinite(page) && page > 0 ? page : 1}
          limit={Number.isFinite(limit) && limit > 0 ? limit : 20}
          q={q}
        />
      </Suspense>
    </div>
  );
}

async function UsersTable({ page, limit, q }: { page: number; limit: number; q: string }) {
  const { users, total, pageSize, hasMore } = await getAdminUsers({ page, limit, q: q || undefined });
  const safeTotal = Number.isFinite(total) ? total : 0;
  const safePageSize = pageSize || limit;
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const startIndex = safeTotal === 0 ? 0 : (page - 1) * safePageSize + 1;
  const endIndex = Math.min(page * safePageSize, safeTotal);
  const buildQuery = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(nextPage));
    params.set("limit", String(safePageSize));
    return `?${params.toString()}`;
  };
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>
          Showing {startIndex}-{endIndex} of {total}
        </span>
        <span>
          Page {page} of {totalPages}
        </span>
        <span>Total = {safeTotal}</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 text-center">#</th>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Roles</th>
            <th className="px-4 py-3">Balances</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((entry, index) => (
            <tr key={entry.id} className="border-t border-slate-100">
              <td className="px-4 py-3 text-center text-xs text-slate-400">
                {startIndex + index}
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{entry.email || entry.username || entry.id}</p>
                <p className="text-xs text-slate-500">
                  {entry.firstName || entry.lastName ? `${entry.firstName || ""} ${entry.lastName || ""}` : "No profile"}
                </p>
                {entry.username && (
                  <p className="text-[11px] text-slate-400">@{entry.username}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  {entry.roles.map((role) => (
                    <StatusBadge key={role} status={role} />
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">{entry.minisBalance.toLocaleString()} MINIS</p>
                <p className="text-[11px] text-slate-400">Ledger adjustments available</p>
              </td>
              <td className="px-4 py-3">
                <CopyActions userId={entry.id} contact={entry.email || entry.username} />
                <RoleForm user={entry} />
                <BalanceAdjustForm user={entry} />
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                No users yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={`/admin/users${buildQuery(page - 1)}`} className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">
              Previous
            </Link>
          ) : (
            <span className="rounded-full border border-slate-100 px-3 py-1 text-slate-400">Previous</span>
          )}
          <span className="text-slate-500">
            Page {page} of {totalPages}
          </span>
          {hasMore ? (
            <Link href={`/admin/users${buildQuery(page + 1)}`} className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">
              Next
            </Link>
          ) : (
            <span className="rounded-full border border-slate-100 px-3 py-1 text-slate-400">Next</span>
          )}
        </div>
      </div>
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
      <input type="number" name="minisDelta" step="1" placeholder="+/- MINIS" className="w-28 rounded-lg border border-slate-200 px-2 py-1" />
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
  const minisDeltaRaw = formData.get("minisDelta");
  const minisDelta = typeof minisDeltaRaw === "string" && minisDeltaRaw.trim() !== "" ? Number(minisDeltaRaw) : 0;
  const noteRaw = formData.get("note");
  const note = typeof noteRaw === "string" && noteRaw.trim().length > 0 ? noteRaw.trim() : undefined;

  if (!Number.isFinite(minisDelta)) {
    return;
  }
  if (minisDelta === 0) {
    return;
  }

  await backendFetch("/api/admin/ledger/adjust", {
    method: "POST",
    body: JSON.stringify({ userId, minisDelta, note }),
  });
  revalidatePath("/admin/users");
}
