import { Suspense } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PendingButton } from "@/components/PendingButton";
import { backendFetch } from "@/lib/backendClient";
import { getAdminVendors, getProfile } from "@/lib/queries";
import { requireToken } from "@/lib/session";

export const dynamic = "force-dynamic";

const statuses = ["PENDING", "APPROVED", "SUSPENDED", "REJECTED"] as const;

type Status = (typeof statuses)[number];

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminVendorsPage({ searchParams }: PageProps) {
  const plainParams = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>;
  const page = Number(
    typeof plainParams.page === "string" ? plainParams.page : Array.isArray(plainParams.page) ? plainParams.page[0] : 1
  );
  const limit = Number(
    typeof plainParams.limit === "string" ? plainParams.limit : Array.isArray(plainParams.limit) ? plainParams.limit[0] : 20
  );
  const q = typeof plainParams.q === "string" ? plainParams.q.trim() : "";
  const status = typeof plainParams.status === "string" ? plainParams.status : "";
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Admin" title="Vendors" description="Approve or suspend vendor accounts." />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <form method="GET" className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search vendors"
            className="w-56 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <select name="status" defaultValue={status} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            {statuses.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
          <input type="hidden" name="limit" value={Number.isFinite(limit) && limit > 0 ? limit : 20} />
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Search</button>
        </form>
        <p className="text-xs text-slate-500">Filter by vendor name or status.</p>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <VendorTable
          page={Number.isFinite(page) && page > 0 ? page : 1}
          limit={Number.isFinite(limit) && limit > 0 ? limit : 20}
          q={q}
          status={status || undefined}
        />
      </Suspense>
    </div>
  );
}

async function VendorTable({
  page,
  limit,
  q,
  status,
}: {
  page: number;
  limit: number;
  q: string;
  status?: string;
}) {
  const { vendors, total, pageSize, hasMore } = await getAdminVendors({
    page,
    limit,
    q: q || undefined,
    status,
  });
  const safeTotal = Number.isFinite(total) ? total : 0;
  const safePageSize = pageSize || limit;
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const startIndex = safeTotal === 0 ? 0 : (page - 1) * safePageSize + 1;
  const endIndex = Math.min(page * safePageSize, safeTotal);
  const buildQuery = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
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
            <th className="px-4 py-3">Vendor</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor, index) => (
            <tr key={vendor._id} className="border-t border-slate-100">
              <td className="px-4 py-3 text-center text-xs text-slate-400">
                {startIndex + index}
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{vendor.name}</p>
                <p className="text-xs text-slate-500">{vendor.description || "No description"}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">{vendor.ownerUserId}</td>
              <td className="px-4 py-3">
                <StatusBadge status={vendor.status} />
              </td>
              <td className="px-4 py-3">
                <StatusForm vendorId={vendor._id} current={vendor.status} />
              </td>
            </tr>
          ))}
          {vendors.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                No vendors found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={`/admin/vendors${buildQuery(page - 1)}`} className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">
              Previous
            </Link>
          ) : (
            <span className="rounded-full border border-slate-100 px-3 py-1 text-slate-400">Previous</span>
          )}
          <span className="text-slate-500">
            Page {page} of {totalPages}
          </span>
          {hasMore ? (
            <Link href={`/admin/vendors${buildQuery(page + 1)}`} className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">
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

function RowSkeleton() {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-3">
        <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
        <div className="mt-2 h-3 w-48 rounded bg-slate-100 animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-6 w-20 rounded-full bg-slate-100 animate-pulse" />
      </td>
      <td className="px-4 py-3">
        <div className="h-6 w-32 rounded bg-slate-100 animate-pulse" />
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Vendor</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, idx) => (
            <RowSkeleton key={idx} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusForm({ vendorId, current }: { vendorId: string; current: Status }) {
  return (
    <form action={updateVendorStatus} className="flex items-center gap-2 text-sm">
      <input type="hidden" name="vendorId" value={vendorId} />
      <select
        name="status"
        defaultValue={current}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <PendingButton pendingLabel="Updating..." className="rounded-lg bg-indigo-600 px-3 py-2 text-white">
        Update
      </PendingButton>
    </form>
  );
}

async function updateVendorStatus(formData: FormData) {
  "use server";
  const vendorId = formData.get("vendorId");
  const status = formData.get("status");
  if (!vendorId || !status) {
    return;
  }
  await backendFetch(`/api/admin/vendors/${vendorId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  revalidatePath("/admin/vendors");
}
