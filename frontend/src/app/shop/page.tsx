import Link from "next/link";
import {
  getSessionUser,
  getShopTabs,
  getProductCategories,
  getStandardProducts,
} from "@/lib/queries";
import { formatMinis } from "@/lib/minis";
import { ShopProductsClient } from "@/components/ShopProductsClient";
import { ShopHeader } from "@/components/ShopHeader";
import { ShopTabNav } from "@/components/ShopTabNav";
import { SiteTopNav } from "@/components/SiteTopNav";

type SearchParams = Record<string, string | string[] | undefined>;

const FALLBACK_TABS = [
  { key: "products", label: "Products", order: 0 },
  { key: "coming-soon", label: "Coming soon", order: 1 },
];

const PLAY_TABS = new Set(["mystery-boxes", "challenges", "jackpot-plays"]);

export const metadata = {
  title: "Shop — Waashop",
  description: "Browse products, mystery boxes, challenges, and jackpots on Waashop.",
  openGraph: {
    title: "Shop — Waashop",
    description: "Browse products, mystery boxes, challenges, and jackpots on Waashop.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop — Waashop",
    description: "Browse products, mystery boxes, challenges, and jackpots on Waashop.",
  },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const query = typeof resolvedParams?.q === "string" ? resolvedParams.q.trim() : "";
  const [user, tabs, categories, standardProducts] = await Promise.all([
    getSessionUser(),
    getShopTabs(),
    getProductCategories(),
    getStandardProducts(),
  ]);
  const tabList = (tabs.length ? tabs : FALLBACK_TABS)
    .slice()
    .filter((tab) => !PLAY_TABS.has(tab.key))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const resolvedTabs = tabList.length ? tabList : FALLBACK_TABS;
  const tabKey = typeof resolvedParams?.tab === "string" ? resolvedParams.tab : "";
  const activeTab = resolvedTabs.find((tab) => tab.key === tabKey) ? tabKey : resolvedTabs[0]?.key;
  const normalizedQuery = query.toLowerCase();
  const activeQuery = normalizedQuery && activeTab ? normalizedQuery : "";

  return (
    <div className="web-shell pb-6">
      <SiteTopNav signedIn={Boolean(user)} />
      <header className="web-panel rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ShopHeader
            activeTab={activeTab}
            initialQuery={query}
            suggestions={standardProducts.map((product) => product.name)}
          />
          {!user && (
            <div className="flex flex-col items-start gap-1">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-black bg-[#000] px-4 py-2 text-xs font-semibold text-white transition hover:bg-black/80"
              >
                Sign in to Shop
              </Link>
              <p className="text-xs text-[color:var(--app-text-muted)]">Use your email or username@pai.</p>
            </div>
          )}
        </div>
        <ShopTabNav tabs={resolvedTabs} activeTab={activeTab} />
      </header>

      {activeTab === "products" && (
        <ShopProductsClient
          products={standardProducts}
          categories={categories}
          signedIn={Boolean(user)}
          query={activeTab === "products" ? query : ""}
        />
      )}
      {activeTab !== "products" && (
        <div className="web-panel rounded-3xl border border-dashed p-8 text-center text-sm text-[color:var(--app-text-muted)]">
          <p className="web-kicker">
            {resolvedTabs.find((tab) => tab.key === activeTab)?.label}
          </p>
          <p className="mt-3 text-lg font-semibold text-[color:var(--app-text)]">Coming soon</p>
          <p className="mt-2">We are preparing new drops for this tab. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
