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
                  {product.type === "CHALLENGE" ? (
                    <p className="text-xs text-slate-500">
                      Challenge · {product.ticketsSold || 0}/{product.ticketCount || 0} tickets · {product.ticketPriceCoins?.toLocaleString() || "0"} coins
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      {product.rewardTiers?.length || 0} reward tiers · {product.priceCoins.toLocaleString()} coins
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {typeof product.vendorId === "string" ? product.vendorId : product.vendorId?.name}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={product.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <ProductStatusForm product={product} />
                    {product.type === "MYSTERY_BOX" && (
                      <details className="rounded-xl border border-slate-100 p-3">
                        <summary className="cursor-pointer text-xs font-semibold text-slate-600">Edit</summary>
                        <form action={adminUpdateProduct} className="mt-2 space-y-2 text-xs">
                          <input type="hidden" name="productId" value={product._id} />
                          <input
                            name="productName"
                            defaultValue={product.name}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                          />
                          <textarea
                            name="productDescription"
                            defaultValue={product.description || ""}
                            rows={2}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                          />
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              type="number"
                              name="priceCoins"
                              defaultValue={product.priceCoins}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1"
                            />
                            <input
                              type="number"
                              name="guaranteedMinPoints"
                              defaultValue={product.guaranteedMinPoints}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1"
                            />
                          </div>
                          <textarea
                            name="rewardTiers"
                            rows={3}
                            defaultValue={JSON.stringify(product.rewardTiers || [], null, 2)}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                          />
                          <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1 text-white">
                            Save
                          </button>
                        </form>
                      </details>
                    )}
                    <form action={adminDeleteProduct}>
                      <input type="hidden" name="productId" value={product._id} />
                      <button type="submit" className="text-xs font-semibold text-red-500">
                        Delete
                      </button>
                    </form>
                  </div>
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

async function adminUpdateProduct(formData: FormData) {
  "use server";
  const productId = formData.get("productId");
  if (!productId || typeof productId !== "string") {
    return;
  }
  const payload = extractProductPayload(formData);
  if (payload.error) {
    throw new Error(payload.error);
  }
  await backendFetch(`/api/admin/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(payload.data),
  });
  revalidatePath("/admin/products");
}

async function adminDeleteProduct(formData: FormData) {
  "use server";
  const productId = formData.get("productId");
  if (!productId) return;
  await backendFetch(`/api/admin/products/${productId}`, { method: "DELETE" });
  revalidatePath("/admin/products");
}

const extractProductPayload = (formData: FormData): { data?: unknown; error?: string } => {
  const name = formData.get("productName");
  const description = formData.get("productDescription");
  const priceCoins = Number(formData.get("priceCoins"));
  const guaranteedMinPoints = Number(formData.get("guaranteedMinPoints"));
  const tiersRaw = formData.get("rewardTiers");

  if (!name || typeof name !== "string") {
    return { error: "Product name is required" };
  }
  if (!Number.isFinite(priceCoins) || priceCoins <= 0) {
    return { error: "Price must be positive" };
  }
  if (!Number.isFinite(guaranteedMinPoints) || guaranteedMinPoints <= 0) {
    return { error: "Guaranteed minimum must be positive" };
  }
  if (!tiersRaw || typeof tiersRaw !== "string") {
    return { error: "Reward tiers JSON is required" };
  }

  let rewardTiers: unknown;
  try {
    rewardTiers = JSON.parse(tiersRaw);
  } catch {
    return { error: "Reward tiers must be valid JSON" };
  }

  if (!Array.isArray(rewardTiers)) {
    return { error: "Reward tiers JSON must be an array" };
  }

  const tiers = rewardTiers.map((tier) => ({
    points: Number(tier.points),
    probability: Number(tier.probability),
    isTop: Boolean(tier.isTop),
  }));

  if (tiers.some((tier) => !Number.isFinite(tier.points) || !Number.isFinite(tier.probability))) {
    return { error: "Each tier requires numeric points/probability" };
  }
  const probabilitySum = tiers.reduce((acc, tier) => acc + tier.probability, 0);
  if (Math.abs(probabilitySum - 1) > 0.01) {
    return { error: "Tier probabilities must sum to 1" };
  }

  return {
    data: {
      name,
      description: typeof description === "string" ? description : undefined,
      priceCoins,
      guaranteedMinPoints,
      rewardTiers: tiers,
    },
  };
};
