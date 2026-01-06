import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getProfile, getVendorOrders, getVendorProducts, getVendorPromoCards } from "@/lib/queries";
import { requireToken } from "@/lib/session";
import { VendorProfileForm } from "@/components/VendorProfileForm";
import { VendorProductForm } from "@/components/VendorProductForm";
import { VendorPromoForm } from "@/components/VendorPromoForm";
import { PendingButton } from "@/components/PendingButton";
import type { OrderDto, ProductDto, PromoCardDto } from "@/types";
import {
  updateVendorProductAction,
  deleteVendorProductAction,
  updatePromoCardAction,
  deletePromoCardAction,
  updateVendorOrderAction,
} from "@/app/vendor/actions";
import { PromoEditFormClient } from "./PromoEditFormClient";
import { VendorWorkspaceClient } from "./VendorWorkspaceClient";

export const dynamic = "force-dynamic";

const CLOSED_ORDER_STATUSES: OrderDto["status"][] = ["COMPLETED", "REFUNDED", "CANCELLED"];
const ORDER_STATUS_SEQUENCE: OrderDto["status"][] = [
  "PLACED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
  "DISPUTED",
  "REFUNDED",
  "CANCELLED",
  "REJECTED",
  "DAMAGED",
  "UNSUCCESSFUL",
];

const formatMinis = (value: number) => value.toLocaleString();

const formatStatusLabel = (status: string) => status.replace(/_/g, " ").toLowerCase();
const formatProductType = (type: ProductDto["type"]) => type.replace(/_/g, " ").toLowerCase();

function SummarySkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-20 rounded-xl border border-slate-100 bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function VendorDashboardPage() {
  await requireToken();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Vendor" title="Vendor Workspace" description="Submit your profile, products, mystery boxes, and challenges." />
      <Suspense fallback={<SummarySkeleton />}>
        <SummarySection />
      </Suspense>
      <VendorWorkspaceClient
        sections={{
          profile: (
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfileSection />
            </Suspense>
          ),
          promos: (
            <Suspense fallback={<PromoSkeleton />}>
              <PromoSection />
            </Suspense>
          ),
          submissions: (
            <Suspense fallback={<ProductSubmitSkeleton />}>
              <SubmissionSection />
            </Suspense>
          ),
          orders: (
            <Suspense fallback={<OrdersSkeleton />}>
              <OrdersSection />
            </Suspense>
          ),
          products: (
            <Suspense fallback={<ProductListSkeleton />}>
              <ProductsSection />
            </Suspense>
          ),
        }}
      />
    </div>
  );
}

async function ProfileSection() {
  const { vendor } = await getProfile();
  return (
    <section id="vendor-profile" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

async function SummarySection() {
  const { vendor, user } = await getProfile();
  const isApproved = vendor?.status === "APPROVED";
  let products: ProductDto[] = [];
  let orders: OrderDto[] = [];
  let promoCards: PromoCardDto[] = [];

  if (isApproved) {
    try {
      const [productsResult, ordersResult, promosResult] = await Promise.all([
        getVendorProducts(),
        getVendorOrders(),
        getVendorPromoCards(),
      ]);
      products = productsResult.products;
      orders = ordersResult.orders;
      promoCards = promosResult.promoCards;
    } catch (error) {
      console.error("Failed to load vendor summary", error);
    }
  }

  const pendingProducts = products.filter((product) => product.status === "PENDING").length;
  const activeProducts = products.filter((product) => product.status === "ACTIVE").length;
  const openOrders = orders.filter((order) => !CLOSED_ORDER_STATUSES.includes(order.status)).length;
  const grossSales = orders.reduce((sum, order) => sum + order.amountMinis, 0);
  const escrowMinis = orders
    .filter((order) => !order.escrowReleased && !CLOSED_ORDER_STATUSES.includes(order.status))
    .reduce((sum, order) => sum + order.amountMinis, 0);
  const paidOutMinis = orders
    .filter((order) => Boolean(order.escrowReleased))
    .reduce((sum, order) => sum + order.amountMinis, 0);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Overview</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Hello {user.firstName || user.username || "vendor"}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {vendor ? "Track submissions, orders, and promo visibility." : "Start by creating your vendor profile."}
          </p>
        </div>
        {vendor && <StatusBadge status={vendor.status} />}
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="Products" value={`${products.length}`} helper={`${activeProducts} active`} />
        <SummaryCard label="Pending reviews" value={`${pendingProducts}`} helper="Awaiting approval" />
        <SummaryCard label="Open orders" value={`${openOrders}`} helper="Need updates" />
        <SummaryCard label="Promo cards" value={`${promoCards.length}`} helper="Submitted" />
        <SummaryCard label="Gross sales" value={`${formatMinis(grossSales)} MINIS`} helper="All orders" />
        <SummaryCard label="Escrow held" value={`${formatMinis(escrowMinis)} MINIS`} helper={`${formatMinis(paidOutMinis)} paid out`} />
      </div>
      {!vendor && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Complete your vendor profile to submit products and promo cards.
        </div>
      )}
    </section>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
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
    <section id="vendor-promos" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
      {card.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.imageUrl} alt={card.title} className="mt-3 h-32 w-full rounded-xl object-cover" />
      )}
      {card.description && <p className="mt-2 text-sm text-slate-500">{card.description}</p>}
      {card.status === "PENDING" && (
        <div className="mt-3 space-y-2">
          <PromoEditFormClient action={vendorUpdatePromo} card={card} />
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
    <section id="vendor-submissions" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Product Submissions</h2>
        <span className="text-xs text-slate-500">Status: {vendor?.status || "N/A"}</span>
      </div>
      {!approved ? (
        <p className="mt-2 text-sm text-slate-500">
          Products, mystery boxes, and challenges can be submitted once your vendor profile is approved.
        </p>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <div className="space-y-4">
            <VendorProductForm />
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Checklist</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-500">
                <li>Clear title + short description.</li>
                <li>High-quality image (optional but recommended).</li>
                <li>Pricing aligned to audience value.</li>
                <li>For challenges: ticket price + total count.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Review window</p>
              <p className="mt-2 text-xs text-slate-500">
                Most submissions are reviewed within 24–48 hours. You can update details while pending.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Quality bar</p>
              <p className="mt-2 text-xs text-slate-500">
                Products with clear value, realistic rewards, and clean imagery move faster through approvals.
              </p>
            </div>
          </div>
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
    <section id="vendor-products" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Your Products</h2>
          <p className="text-sm text-slate-500">Track approval status and pricing.</p>
        </div>
        <span className="text-xs text-slate-500">Total = {products.length}</span>
      </div>
      <div className="mt-4 space-y-3">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
        {products.length === 0 && <p className="text-sm text-slate-500">No products submitted yet.</p>}
      </div>
    </section>
  );
}

async function OrdersSection() {
  const { vendor } = await getProfile();
  if (!vendor || vendor.status !== "APPROVED") {
    return (
      <section id="vendor-orders" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Orders</h2>
        <p className="text-sm text-slate-500">Orders will appear after approval.</p>
      </section>
    );
  }
  let orders: OrderDto[] = [];
  try {
    const result = await getVendorOrders();
    orders = result.orders;
  } catch (error) {
    console.error("Failed to load vendor orders", error);
  }
  const statusSummary = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  return (
    <section id="vendor-orders" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Orders</h2>
          <p className="text-sm text-slate-500">Manage fulfillment and tracking.</p>
        </div>
        <span className="text-xs text-slate-500">Total = {orders.length}</span>
      </div>
      {orders.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          {ORDER_STATUS_SEQUENCE.filter((status) => statusSummary[status]).map((status) => (
            <span key={status} className="rounded-full border border-slate-200 px-3 py-1">
              {formatStatusLabel(status)} · {statusSummary[status]}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 space-y-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
        {orders.length === 0 && <p className="text-sm text-slate-500">No orders yet.</p>}
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
          <p className="text-xs text-slate-500">{product.priceMinis.toLocaleString()} MINIS</p>
          <p className="text-xs text-slate-400">Updated {new Date(product.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {formatProductType(product.type)}
          </span>
          <StatusBadge status={product.status} />
        </div>
      </div>
      {product.imageUrl && (
        <div className="mt-3 h-28 w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        </div>
      )}
      <p className="mt-2 text-sm text-slate-500">{product.description || "No description"}</p>
      {product.type === "CHALLENGE" ? (
        <p className="mt-2 text-xs text-slate-500">
          Challenge · {product.ticketsSold || 0}/{product.ticketCount || 0} tickets sold · {product.ticketPriceMinis?.toLocaleString() || ""} MINIS
        </p>
      ) : product.type === "STANDARD" ? (
        <p className="mt-2 text-xs text-slate-500">Standard product · {product.priceMinis.toLocaleString()} MINIS</p>
      ) : product.type === "JACKPOT_PLAY" ? (
        <p className="mt-2 text-xs text-slate-500">
          Jackpot play · Win odds {((product.jackpotWinOdds || 0) * 100).toFixed(2)}% · {product.priceMinis.toLocaleString()} MINIS
        </p>
      ) : null}
      {product.type === "CHALLENGE" && product.challengeWinnerUserId && (
        <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-slate-600">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-700">Winner</p>
          <p className="mt-1 font-semibold text-slate-900">
            {product.challengeWinnerUsername ? `@${product.challengeWinnerUsername}` : product.challengeWinnerUserId} · Ticket #
            {product.challengeWinnerTicketNumber ?? "—"}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            {product.challengePrizeDeliveredAt ? "Delivered" : "Awaiting delivery"}
            {product.challengeWinnerConfirmedAt ? " · Confirmed" : ""}
            {product.challengePrizeClaimedAt ? " · Claimed" : ""}
          </p>
          {product.challengePrizeClaimedAt && (
            <div className="mt-2 text-[11px] text-slate-600">
              <p className="font-semibold text-slate-800">Delivery details</p>
              <p>{product.challengePrizeRecipientName || "—"}</p>
              <p>{product.challengePrizeRecipientPhone || "—"}</p>
              <p className="whitespace-pre-line">{product.challengePrizeRecipientAddress || "—"}</p>
              {product.challengePrizeClaimNote && (
                <p className="mt-1 text-[10px] text-slate-500">{product.challengePrizeClaimNote}</p>
              )}
            </div>
          )}
        </div>
      )}
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
      {product.status === "PENDING" && product.type === "STANDARD" && (
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
              <input
                type="number"
                name="priceMinis"
                defaultValue={product.priceMinis}
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
      {product.status === "PENDING" && product.type === "JACKPOT_PLAY" && (
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
                  name="winOdds"
                  step="0.001"
                  min="0.001"
                  max="1"
                  defaultValue={product.jackpotWinOdds}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
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

function OrderCard({ order }: { order: OrderDto }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">Order {order.id.slice(-6)}</p>
          <p className="text-xs text-slate-500">Amount: {order.amountMinis.toLocaleString()} MINIS</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-2 text-xs text-slate-500">
        <p>Shipping: {order.shippingName || "—"}</p>
        <p>Phone: {order.shippingPhone || "—"}</p>
        <p>Address: {order.shippingAddress || "—"}</p>
      </div>
      <div className="mt-2 text-xs text-slate-500">
        {order.escrowReleased ? (
          <span className="font-semibold text-emerald-600">Funds paid out</span>
        ) : (
          <span className="font-semibold text-amber-600">Funds pending in escrow</span>
        )}
      </div>
      {order.events && order.events.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {(() => {
            const latestEvent = order.events?.[order.events.length - 1];
            if (!latestEvent) return null;
            return (
              <>
                <p className="font-semibold text-slate-700">Latest update: {formatStatusLabel(latestEvent.status)}</p>
                {latestEvent.note && <p>{latestEvent.note}</p>}
              </>
            );
          })()}
        </div>
      )}
      {order.status !== "COMPLETED" &&
        order.status !== "REFUNDED" &&
        order.status !== "CANCELLED" && (
          <form action={vendorUpdateOrder} className="mt-3 grid gap-2 text-xs sm:grid-cols-[1fr,1fr,1fr,auto]">
            <input type="hidden" name="orderId" value={order.id} />
            <select
              name="status"
              defaultValue=""
              className="rounded-lg border border-slate-200 px-2 py-1"
            >
              <option value="">Add update only</option>
              <option value="PACKED">Packed</option>
              <option value="SHIPPED">Shipped</option>
              <option value="OUT_FOR_DELIVERY">Out for delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="REJECTED">Rejected</option>
              <option value="DAMAGED">Damaged</option>
              <option value="UNSUCCESSFUL">Unsuccessful</option>
            </select>
            <input
              name="trackingCode"
              defaultValue={order.trackingCode || ""}
              placeholder="Tracking code"
              className="rounded-lg border border-slate-200 px-2 py-1"
            />
            <input
              name="note"
              placeholder="Vendor note"
              className="rounded-lg border border-slate-200 px-2 py-1"
            />
            <PendingButton pendingLabel="Updating..." className="rounded-lg bg-indigo-600 px-3 py-1 text-white">
              Update
            </PendingButton>
          </form>
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

function OrdersSkeleton() {
  return <CardSkeleton height="h-24" />;
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

async function vendorUpdateOrder(formData: FormData) {
  "use server";
  await updateVendorOrderAction(emptyState, formData);
}
