import { Suspense } from "react";
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

export default async function AdminVendorsPage() {
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Admin" title="Vendors" description="Approve or suspend vendor accounts." />
      <Suspense fallback={<TableSkeleton />}>
        <VendorTable />
      </Suspense>
    </div>
  );
}

async function VendorTable() {
  const { vendors } = await getAdminVendors();
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
          {vendors.map((vendor) => (
            <tr key={vendor._id} className="border-t border-slate-100">
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
              <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                No vendors found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
