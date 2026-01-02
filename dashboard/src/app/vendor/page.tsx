import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getProfile, getVendorProducts, getVendorPromoCards } from "@/lib/queries";
import { requireToken } from "@/lib/session";
import { VendorProfileForm } from "@/components/VendorProfileForm";
import { VendorProductForm } from "@/components/VendorProductForm";
import { VendorPromoForm } from "@/components/VendorPromoForm";
import { PendingButton } from "@/components/PendingButton";
import type { ProductDto, PromoCardDto } from "@/types";
import {
  updateVendorProductAction,
  deleteVendorProductAction,
  updatePromoCardAction,
  deletePromoCardAction,
} from "@/app/vendor/actions";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  await requireToken();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Vendor" title="Vendor Workspace" description="Submit your profile and mystery boxes." />
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileSection />
      </Suspense>
      <Suspense fallback={<PromoSkeleton />}>
        <PromoSection />
      </Suspense>
      <Suspense fallback={<ProductSubmitSkeleton />}>
        <SubmissionSection />
      </Suspense>
      <Suspense fallback={<ProductListSkeleton />}>
        <ProductsSection />
      </Suspense>
    </div>
  );
}

async function ProfileSection() {
  const { vendor } = await getProfile();
  return (
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
  );
}

async function PromoSection() {
  const { vendor } = await getProfile();
  const isApproved = vendor?.status === "APPROVED";
  let promoCards: PromoCardDto[] = [];
  if (isApproved) {
    try {
      const { promoCards: cards } = await getVendorPromoCards();
      promoCards = cards as PromoCardDto[];
    } catch (error) {
      console.error("Failed to load promo cards", error);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Promoted card</h2>
        <span className="text-xs text-slate-500">Optional paid slot</span>
      </div>
      {!isApproved ? (
        <p className="mt-2 text-sm text-slate-500">Promo cards unlock after approval.</p>
      ) : (
        <div className="mt-4 space-y-6">
          <VendorPromoForm />
          <div className="space-y-3 text-sm text-slate-600">
            {promoCards.map((card) => (
              <PromoCardItem key={card.id} card={card} />
            ))}
            {promoCards.length === 0 && <p>No promo cards submitted yet.</p>}
          </div>
        </div>
      )}
    </section>
  );
}

function PromoCardItem({ card }: { card: PromoCardDto }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-slate-900">{card.title}</p>
        {card.status && <StatusBadge status={card.status} />}
      </div>
      {card.description && <p className="mt-2 text-sm text-slate-500">{card.description}</p>}
      {card.status === "PENDING" && (
        <div className="mt-3 space-y-2">
          <form action={vendorUpdatePromo} className="space-y-2">
            <input type="hidden" name="promoId" value={card.id} />
            <input name="promoTitle" defaultValue={card.title} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
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
            <PendingButton pendingLabel="Saving..." className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
              Save promo
            </PendingButton>
          </form>
          <form action={vendorDeletePromo}>
            <input type="hidden" name="promoId" value={card.id} />
            <PendingButton pendingLabel="Deleting..." className="text-sm font-semibold text-red-500">
              Delete promo
            </PendingButton>
          </form>
        </div>
      )}
    </div>
  );
}

async function SubmissionSection() {
  const { vendor } = await getProfile();
  const approved = vendor?.status === "APPROVED";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Mystery Box Submissions</h2>
        <span className="text-xs text-slate-500">Status: {vendor?.status || "N/A"}</span>
      </div>
      {!approved ? (
        <p className="mt-2 text-sm text-slate-500">Products can be submitted once your vendor profile is approved.</p>
      ) : (
        <div className="mt-4">
          <VendorProductForm />
        </div>
      )}
    </section>
  );
}

async function ProductsSection() {
  const { vendor } = await getProfile();
  if (!vendor) {
    return null;
  }
  let products: ProductDto[] = [];
  if (vendor.status === "APPROVED") {
    try {
      const { products: vendorProducts } = await getVendorProducts();
      products = vendorProducts;
    } catch (error) {
      console.error("Failed to load vendor products", error);
    }
  }
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Your Products</h2>
      <p className="text-sm text-slate-500">Track approval status and pricing.</p>
      <div className="mt-4 space-y-3">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
        {products.length === 0 && <p className="text-sm text-slate-500">No products submitted yet.</p>}
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: ProductDto }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{product.name}</p>
          <p className="text-xs text-slate-500">{product.priceMinis.toLocaleString()}MIN</p>
        </div>
        <StatusBadge status={product.status} />
      </div>
      <p className="mt-2 text-sm text-slate-500">{product.description || "No description"}</p>
      {product.type === "CHALLENGE" ? (
        <p className="mt-2 text-xs text-slate-500">
          Challenge · {product.ticketsSold || 0}/{product.ticketCount || 0} tickets sold · {product.ticketPriceMinis?.toLocaleString() || ""}MIN
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
                  name="priceMinis"
                  defaultValue={product.priceMinis}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  name="guaranteedMinMinis"
                  defaultValue={product.guaranteedMinMinis}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <textarea
                name="rewardTiers"
                rows={4}
                defaultValue={JSON.stringify(product.rewardTiers || [], null, 2)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <PendingButton pendingLabel="Saving..." className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                Save changes
              </PendingButton>
            </form>
          </details>
          <form action={vendorDeleteProduct}>
            <input type="hidden" name="productId" value={product._id} />
            <PendingButton pendingLabel="Deleting..." className="text-sm font-semibold text-red-500">
              Delete product
            </PendingButton>
          </form>
        </div>
      )}
    </div>
  );
}

function CardSkeleton({ height = "h-40" }: { height?: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className={`${height} rounded bg-slate-100`} />
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return <CardSkeleton height="h-16" />;
}

function PromoSkeleton() {
  return <CardSkeleton height="h-28" />;
}

function ProductSubmitSkeleton() {
  return <CardSkeleton height="h-20" />;
}

function ProductListSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-20 rounded bg-slate-100" />
        <div className="h-20 rounded bg-slate-100" />
      </div>
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
