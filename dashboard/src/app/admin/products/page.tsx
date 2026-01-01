import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
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
      <PageHeader eyebrow="Admin" title="Products" description="Moderate vendor submissions." />
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
                  <StatusBadge status={product.status} />
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
