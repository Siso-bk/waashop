import Link from "next/link";
import { getActiveBoxes, getSessionUser, getShopTabs, getStandardProducts } from "@/lib/queries";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { RewardTable } from "@/components/RewardTable";
import { formatMinis } from "@/lib/minis";
import { StandardProductOrderCard } from "@/components/StandardProductOrderCard";
import { backendFetch } from "@/lib/backendClient";

type SearchParams = Record<string, string | string[] | undefined>;

const FALLBACK_TABS = [
  { key: "mystery-boxes", label: "Mystery boxes", order: 0 },
  { key: "products", label: "Products", order: 1 },
  { key: "challenges", label: "Challenges", order: 2 },
  { key: "coming-soon", label: "Coming soon", order: 3 },
];

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const [boxes, user, tabs, standardProducts] = await Promise.all([
    getActiveBoxes(),
    getSessionUser(),
    getShopTabs(),
    getStandardProducts(),
  ]);
  const tabList = (tabs.length ? tabs : FALLBACK_TABS)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const tabKey = typeof resolvedParams?.tab === "string" ? resolvedParams.tab : "";
  const activeTab = tabList.find((tab) => tab.key === tabKey) ? tabKey : tabList[0]?.key;

  return (
    <div className="space-y-1 pb-5">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Shop</p>
        {!user && (
          <div className="space-y-1">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-black px-4 py-2 text-xs font-semibold text-black hover:bg-black hover:text-white"
            >
              Sign in to Shop
            </Link>
            <p className="text-xs text-gray-500">Use your email or username@pai.</p>
          </div>
        )}
      </header>
      <nav className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {tabList.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={`/shop?tab=${tab.key}`}
              className={`whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.26em] text-black transition hover:opacity-80 ${
                isActive ? "underline underline-offset-8 decoration-2" : ""
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {activeTab === "mystery-boxes" && (
        <div className="flex gap-6 overflow-x-auto pb-3">
          {boxes.map((box) => (
            <article
              key={box.boxId}
              className="flex min-w-[280px] flex-col rounded-3xl border border-black/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-black/30 hover:shadow-xl"
            >
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>BOX PER PRICE</span>
                <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                  {formatMinis(box.priceMinis ?? 0)}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-black">{box.name}</h3>
              <div className="mt-4">
                <RewardTable tiers={box.rewardTiers} guaranteedMin={box.guaranteedMinMinis} />
              </div>
              <div className="mt-6">
                <BoxPurchaseButton box={box} disabled={!user} />
              </div>
            </article>
          ))}
          {!boxes.length && (
            <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
              No boxes available right now. Follow Waashop announcements for the next drop.
            </div>
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="flex gap-6 overflow-x-auto pb-3">
          {standardProducts.map((product) => (
            <StandardProductOrderCard
              key={product.id}
              product={product}
              signedIn={Boolean(user)}
              createOrder={createOrder}
            />
          ))}
          {standardProducts.length === 0 && (
            <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
              No products available right now. Check back soon.
            </div>
          )}
        </div>
      )}

      {activeTab !== "mystery-boxes" && activeTab !== "products" && (
        <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
            {tabList.find((tab) => tab.key === activeTab)?.label}
          </p>
          <p className="mt-3 text-lg font-semibold text-black">Coming soon</p>
          <p className="mt-2">We are preparing new drops for this tab. Check back soon.</p>
        </div>
      )}
    </div>
  );
}

type OrderState = { status: "idle" | "success" | "error"; message?: string };

async function createOrder(_prev: OrderState, formData: FormData): Promise<OrderState> {
  "use server";
  const productId = formData.get("productId");
  if (!productId || typeof productId !== "string") {
    return { status: "error", message: "Missing product." };
  }
  const payload = {
    productId,
    shippingName: valueOrUndefined(formData.get("shippingName")),
    shippingPhone: valueOrUndefined(formData.get("shippingPhone")),
    shippingAddress: valueOrUndefined(formData.get("shippingAddress")),
    notes: valueOrUndefined(formData.get("notes")),
  };
  if (!payload.shippingName || !payload.shippingPhone || !payload.shippingAddress) {
    return { status: "error", message: "Shipping name, phone, and address are required." };
  }
  try {
    await backendFetch("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { status: "success", message: "Order placed. Track it in your orders page." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to place order.";
    return { status: "error", message };
  }
}

const valueOrUndefined = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
