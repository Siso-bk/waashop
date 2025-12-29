import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/backendClient";
import { getAdminProducts, getProfile } from "@/lib/queries";
import { requireToken } from "@/lib/session";
import { ProductDto } from "@/types";

export const dynamic = "force-dynamic";

const productStatuses = ["PENDING", "ACTIVE", "INACTIVE"] as const;

export default async function AdminProductsPage() {
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }
  const { products } = await getAdminProducts();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-wide text-indigo-600">Admin</p>
        <h1 className="text-3xl font-semibold text-slate-900">Products</h1>
        <p className="text-sm text-slate-500">Moderate vendor submissions.</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    {product.rewardTiers?.length || 0} reward tiers · {product.priceCoins.toLocaleString()} coins
                  </p>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {typeof product.vendorId === "string" ? product.vendorId : product.vendorId?.name}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(product.status)}`}>
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ProductStatusForm product={product} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                  No products submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductStatusForm({ product }: { product: ProductDto }) {
  return (
    <form action={updateProductStatus} className="flex items-center gap-2 text-sm">
      <input type="hidden" name="productId" value={product._id} />
      <select name="status" defaultValue={product.status} className="rounded-lg border border-slate-200 px-3 py-2">
        {productStatuses.map((status) => (
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

const statusClass = (status: string) => {
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

async function updateProductStatus(formData: FormData) {
  "use server";
  const productId = formData.get("productId");
  const status = formData.get("status");
  if (!productId || !status) {
    return;
  }
  await backendFetch(`/api/admin/products/${productId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  revalidatePath("/admin/products");
}
