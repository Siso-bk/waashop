import { Suspense } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PendingButton } from "@/components/PendingButton";
import { backendFetch } from "@/lib/backendClient";
import { getAdminProducts, getProfile } from "@/lib/queries";
import { requireToken } from "@/lib/session";
import { ProductDto } from "@/types";

export const dynamic = "force-dynamic";

const productStatuses = ["PENDING", "ACTIVE", "INACTIVE"] as const;

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const plainParams = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>;
  const page = Number(
    typeof plainParams.page === "string" ? plainParams.page : Array.isArray(plainParams.page) ? plainParams.page[0] : 1
  );
  const limit = Number(
    typeof plainParams.limit === "string" ? plainParams.limit : Array.isArray(plainParams.limit) ? plainParams.limit[0] : 20
  );
  const q = typeof plainParams.q === "string" ? plainParams.q.trim() : "";
  const status = typeof plainParams.status === "string" ? plainParams.status : "";
  const sort = typeof plainParams.sort === "string" ? plainParams.sort : "newest";
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Admin" title="Products" description="Moderate vendor submissions." />
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form method="GET" className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-2.5 text-xs text-slate-400">🔎</span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search products"
                className="w-60 rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm"
              />
            </div>
            <select name="status" defaultValue={status} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">All statuses</option>
              {productStatuses.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
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
            <select name="sort" defaultValue={sort} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="status">Status</option>
            </select>
            <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Search</button>
          </form>
          <p className="text-xs text-slate-500">Search by name, status, or vendor.</p>
        </div>
      </div>
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsTable
          page={Number.isFinite(page) && page > 0 ? page : 1}
          limit={Number.isFinite(limit) && limit > 0 ? limit : 20}
          q={q}
          status={status || undefined}
          sort={sort}
        />
      </Suspense>
    </div>
  );
}

async function ProductsTable({
  page,
  limit,
  q,
  status,
  sort,
}: {
  page: number;
  limit: number;
  q: string;
  status?: string;
  sort: string;
}) {
  const { products, total, pageSize, hasMore } = await getAdminProducts({
    page,
    limit,
    q: q || undefined,
    status,
    sort,
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
    if (sort) params.set("sort", sort);
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
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Vendor</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={product._id} className="border-t border-slate-100">
              <td className="px-4 py-3 text-center text-xs text-slate-400">
                {startIndex + index}
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold text-slate-900">{product.name}</p>
                {product.type === "CHALLENGE" ? (
                  <p className="text-xs text-slate-500">
                    Challenge · {product.ticketsSold || 0}/{product.ticketCount || 0} tickets · {product.ticketPriceMinis?.toLocaleString() || "0"} MINIS
                  </p>
                ) : product.type === "JACKPOT_PLAY" ? (
                  <p className="text-xs text-slate-500">
                    Jackpot play · Win odds {((product.jackpotWinOdds || 0) * 100).toFixed(2)}% · {product.priceMinis.toLocaleString()} MINIS
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    {product.rewardTiers?.length || 0} reward tiers · {product.priceMinis.toLocaleString()} MINIS
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span className="rounded-full border border-slate-200 px-2 py-0.5">{product.type}</span>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
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
                        <input type="hidden" name="type" value={product.type} />
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
                            name="priceMinis"
                            defaultValue={product.priceMinis}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                          />
                          <input
                            type="number"
                            name="guaranteedMinMinis"
                            defaultValue={product.guaranteedMinMinis}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                          />
                        </div>
                        <textarea
                          name="rewardTiers"
                          rows={3}
                          defaultValue={JSON.stringify(product.rewardTiers || [], null, 2)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1"
                        />
                        <PendingButton pendingLabel="Saving..." className="rounded-lg bg-slate-900 px-3 py-1 text-white">
                          Save
                        </PendingButton>
                      </form>
                    </details>
                  )}
                  {product.type === "JACKPOT_PLAY" && (
                    <details className="rounded-xl border border-slate-100 p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-600">Edit</summary>
                      <form action={adminUpdateProduct} className="mt-2 space-y-2 text-xs">
                        <input type="hidden" name="productId" value={product._id} />
                        <input type="hidden" name="type" value={product.type} />
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
                            name="priceMinis"
                            defaultValue={product.priceMinis}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                          />
                          <input
                            type="number"
                            name="winOdds"
                            step="0.001"
                            min="0.001"
                            max="1"
                            defaultValue={product.jackpotWinOdds}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                          />
                        </div>
                        <PendingButton pendingLabel="Saving..." className="rounded-lg bg-slate-900 px-3 py-1 text-white">
                          Save
                        </PendingButton>
                      </form>
                    </details>
                  )}
                  <form action={adminDeleteProduct}>
                    <input type="hidden" name="productId" value={product._id} />
                    <PendingButton pendingLabel="Deleting..." className="text-xs font-semibold text-red-500">
                      Delete
                    </PendingButton>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                No products submitted yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        <span>
          Showing {startIndex}-{endIndex} of {total}
        </span>
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={`/admin/products${buildQuery(page - 1)}`} className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">
              Previous
            </Link>
          ) : (
            <span className="rounded-full border border-slate-100 px-3 py-1 text-slate-400">Previous</span>
          )}
          <span className="text-slate-500">
            Page {page} of {totalPages}
          </span>
          {hasMore ? (
            <Link href={`/admin/products${buildQuery(page + 1)}`} className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">
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

function ProductsSkeleton() {
  return (
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
          {Array.from({ length: 5 }).map((_, idx) => (
            <tr key={idx} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
                <div className="mt-2 h-3 w-32 rounded bg-slate-100 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-16 rounded-full bg-slate-100 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-32 rounded bg-slate-100 animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
      <PendingButton pendingLabel="Updating..." className="rounded-lg bg-indigo-600 px-3 py-2 text-white">
        Update
      </PendingButton>
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
  const priceMinis = Number(formData.get("priceMinis"));
  const guaranteedMinMinis = Number(formData.get("guaranteedMinMinis"));
  const tiersRaw = formData.get("rewardTiers");

  if (!name || typeof name !== "string") {
    return { error: "Product name is required" };
  }
  if (!Number.isFinite(priceMinis) || priceMinis <= 0) {
    return { error: "Price must be positive" };
  }
  if (!Number.isFinite(guaranteedMinMinis) || guaranteedMinMinis <= 0) {
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
    minis: Number(tier.minis),
    probability: Number(tier.probability),
    isTop: Boolean(tier.isTop),
  }));

  if (tiers.some((tier) => !Number.isFinite(tier.minis) || !Number.isFinite(tier.probability))) {
    return { error: "Each tier requires numeric MINI/probability" };
  }
  const probabilitySum = tiers.reduce((acc, tier) => acc + tier.probability, 0);
  if (Math.abs(probabilitySum - 1) > 0.01) {
    return { error: "Tier probabilities must sum to 1" };
  }

  return {
    data: {
      name,
      description: typeof description === "string" ? description : undefined,
      priceMinis,
      guaranteedMinMinis,
      rewardTiers: tiers,
    },
  };
};
