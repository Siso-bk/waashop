import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getProfile, getVendorProducts, getVendorPromoCards } from "@/lib/queries";
import { requireToken } from "@/lib/session";
import { VendorProfileForm } from "@/components/VendorProfileForm";
import { VendorProductForm } from "@/components/VendorProductForm";
import { VendorPromoForm } from "@/components/VendorPromoForm";
import { ProductDto, PromoCardDto } from "@/types";
import { updateVendorProductAction, deleteVendorProductAction, updatePromoCardAction, deletePromoCardAction } from "@/app/vendor/actions";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  await requireToken();
  const { user, vendor } = await getProfile();
  if (!user.roles.includes("vendor") && !vendor) {
    // allow creation but ensure user has vendor role by submitting form
  }

  let products: ProductDto[] = [];
  let promoCards: PromoCardDto[] = [];
  if (vendor && vendor.status === "APPROVED") {
    try {
      const { products: vendorProducts } = await getVendorProducts();
      products = vendorProducts;
    } catch (error) {
      console.error("Failed to load vendor products", error);
    }
    try {
      const { promoCards: cards } = await getVendorPromoCards();
      promoCards = cards as PromoCardDto[];
    } catch (error) {
      console.error("Failed to load promo cards", error);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Vendor"
        title="Vendor Workspace"
        description="Submit your profile and mystery boxes for review."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          {vendor && <StatusBadge status={vendor.status} />}
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
          <h2 className="text-lg font-semibold text-slate-900">Promoted card</h2>
          <span className="text-xs text-slate-500">Optional paid slot</span>
        </div>
        {vendor?.status !== "APPROVED" ? (
          <p className="mt-2 text-sm text-slate-500">Promo cards unlock after approval.</p>
        ) : (
          <div className="mt-4 space-y-6">
            <VendorPromoForm />
            <div className="space-y-3 text-sm text-slate-600">
              {promoCards.map((card) => (
                <div key={card.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{card.title}</p>
                    {card.status && <StatusBadge status={card.status} />}
                  </div>
                  {card.description && <p className="mt-2 text-sm text-slate-500">{card.description}</p>}
                  {card.status === "PENDING" && (
                <div className="mt-3 space-y-2">
                  <form action={vendorUpdatePromo} className="space-y-2">
                    <input type="hidden" name="promoId" value={card.id} />
                        <input
                          name="promoTitle"
                          defaultValue={card.title}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                        <textarea
                          name="promoDescription"
                          defaultValue={card.description || ""}
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                        <input
                          name="promoCtaLabel"
                          defaultValue={card.ctaLabel || ""}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          placeholder="CTA label"
                        />
                        <input
                          name="promoCtaHref"
                          defaultValue={card.ctaHref || ""}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          placeholder="/boxes/BOX_123"
                        />
                        <input
                          name="promoImageUrl"
                          defaultValue={card.imageUrl || ""}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          placeholder="https://..."
                        />
                        <button
                          type="submit"
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Save promo
                        </button>
                      </form>
                  <form action={vendorDeletePromo}>
                    <input type="hidden" name="promoId" value={card.id} />
                        <button type="submit" className="text-sm font-semibold text-red-500">
                          Delete promo
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
              {promoCards.length === 0 && <p>No promo cards submitted yet.</p>}
            </div>
          </div>
        )}
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
                <StatusBadge status={product.status} />
              </div>
              <p className="mt-2 text-sm text-slate-500">{product.description || "No description"}</p>
              {product.type === "CHALLENGE" ? (
                <p className="mt-2 text-xs text-slate-500">
                  Challenge · {product.ticketsSold || 0}/{product.ticketCount || 0} tickets sold · {product.ticketPriceCoins?.toLocaleString() || ""} coins each
                </p>
              ) : null}
              {product.status === "PENDING" && product.type === "MYSTERY_BOX" && (
                <div className="mt-3 space-y-3">
                  <details className="rounded-xl border border-slate-200 p-3">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">Edit product</summary>
                    <form action={vendorUpdateProduct} className="mt-3 space-y-3">
                      <input type="hidden" name="productId" value={product._id} />
                      <input type="hidden" name="type" value={product.type} />
                      <input
                        type="text"
                        name="productName"
                        defaultValue={product.name}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        name="productDescription"
                        defaultValue={product.description || ""}
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="number"
                          name="priceCoins"
                          defaultValue={product.priceCoins}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                        <input
                          type="number"
                          name="guaranteedMinPoints"
                          defaultValue={product.guaranteedMinPoints}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <textarea
                        name="rewardTiers"
                        rows={4}
                        defaultValue={JSON.stringify(product.rewardTiers || [], null, 2)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Save changes
                      </button>
                    </form>
                  </details>
                  <form action={vendorDeleteProduct}>
                    <input type="hidden" name="productId" value={product._id} />
                    <button type="submit" className="text-sm font-semibold text-red-500">
                      Delete product
                    </button>
                  </form>
                </div>
              )}
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

const emptyState = {};

async function vendorUpdateProduct(formData: FormData) {
  "use server";
  await updateVendorProductAction(emptyState, formData);
}

async function vendorDeleteProduct(formData: FormData) {
  "use server";
  await deleteVendorProductAction(emptyState, formData);
}

async function vendorUpdatePromo(formData: FormData) {
  "use server";
  await updatePromoCardAction(emptyState, formData);
}

async function vendorDeletePromo(formData: FormData) {
  "use server";
  await deletePromoCardAction(emptyState, formData);
}
