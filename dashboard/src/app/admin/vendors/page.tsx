import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const { vendors } = await getAdminVendors();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-wide text-indigo-600">Admin</p>
        <h1 className="text-3xl font-semibold text-slate-900">Vendors</h1>
        <p className="text-sm text-slate-500">Approve or suspend vendor accounts.</p>
      </div>
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
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(vendor.status)}`}>
                    {vendor.status}
                  </span>
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
      <button className="rounded-lg bg-indigo-600 px-3 py-2 text-white" type="submit">
        Update
      </button>
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
