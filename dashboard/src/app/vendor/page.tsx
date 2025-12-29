import { getProfile, getVendorProducts } from "@/lib/queries";
import { requireToken } from "@/lib/session";
import { VendorProfileForm } from "@/components/VendorProfileForm";
import { VendorProductForm } from "@/components/VendorProductForm";
import { ProductDto } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  await requireToken();
  const { user, vendor } = await getProfile();
  if (!user.roles.includes("vendor") && !vendor) {
    // allow creation but ensure user has vendor role by submitting form
  }

  let products: ProductDto[] = [];
  if (vendor && vendor.status === "APPROVED") {
    try {
      const { products: vendorProducts } = await getVendorProducts();
      products = vendorProducts;
    } catch (error) {
      console.error("Failed to load vendor products", error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-indigo-600">Vendor</p>
        <h1 className="text-3xl font-semibold text-slate-900">Vendor Workspace</h1>
        <p className="text-sm text-slate-500">Submit your profile and mystery boxes for review.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          {vendor && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(vendor.status)}`}>
              {vendor.status}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {vendor ? "Update your vendor details" : "Complete your vendor profile to request approval."}
        </p>
        <div className="mt-4">
          <VendorProfileForm vendor={vendor} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Mystery Box Submissions</h2>
          <span className="text-xs text-slate-500">Status: {vendor?.status || "N/A"}</span>
        </div>
        {vendor?.status !== "APPROVED" ? (
          <p className="mt-2 text-sm text-slate-500">
            Products can be submitted once your vendor profile is approved.
          </p>
        ) : (
          <div className="mt-4">
            <VendorProductForm />
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Your Products</h2>
        <p className="text-sm text-slate-500">Track approval status and pricing.</p>
        <div className="mt-4 space-y-3">
          {products.map((product) => (
            <div key={product._id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.priceCoins.toLocaleString()} coins</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${productStatusClass(product.status)}`}>
                  {product.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{product.description || "No description"}</p>
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-sm text-slate-500">No products submitted yet.</p>
          )}
        </div>
      </section>
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

const productStatusClass = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";
    case "PENDING":
      return "bg-amber-100 text-amber-700";
    case "INACTIVE":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};
