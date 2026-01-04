import Link from "next/link";
import {
  getActiveBoxes,
  getChallenges,
  getSessionUser,
  getShopTabs,
  getStandardProducts,
} from "@/lib/queries";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import { RewardTable } from "@/components/RewardTable";
import { formatMinis } from "@/lib/minis";
import { ShopProductsClient } from "@/components/ShopProductsClient";
import { ShopHeader } from "@/components/ShopHeader";
import { ChallengePurchaseButton } from "@/components/ChallengePurchaseButton";

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
  const query = typeof resolvedParams?.q === "string" ? resolvedParams.q.trim() : "";
  const [boxes, user, tabs, standardProducts, challenges] = await Promise.all([
    getActiveBoxes(),
    getSessionUser(),
    getShopTabs(),
    getStandardProducts(),
    getChallenges(),
  ]);
  const normalizedQuery = query.toLowerCase();
  const activeQuery = normalizedQuery && activeTab ? normalizedQuery : "";
  const filteredBoxes =
    activeTab === "mystery-boxes" && activeQuery
      ? boxes.filter((box) => box.name.toLowerCase().includes(activeQuery))
      : boxes;
  const filteredChallenges =
    activeTab === "challenges" && activeQuery
      ? challenges.filter((challenge) =>
          `${challenge.name} ${challenge.description ?? ""}`.toLowerCase().includes(activeQuery)
        )
      : challenges;
  const tabList = (tabs.length ? tabs : FALLBACK_TABS)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const tabKey = typeof resolvedParams?.tab === "string" ? resolvedParams.tab : "";
  const activeTab = tabList.find((tab) => tab.key === tabKey) ? tabKey : tabList[0]?.key;

  return (
    <div className="space-y-1 pb-5">
      <header className="space-y-2">
        <ShopHeader activeTab={activeTab} initialQuery={query} />
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
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("waashop:shop-tab"));
                }
              }}
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
          {filteredBoxes.map((box) => (
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
          {!filteredBoxes.length && (
            <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
              {boxes.length === 0
                ? "No boxes available right now. Follow Waashop announcements for the next drop."
                : "No boxes match your search."}
            </div>
          )}
        </div>
      )}

      {activeTab === "products" && (
        <ShopProductsClient
          products={standardProducts}
          signedIn={Boolean(user)}
          query={activeTab === "products" ? query : ""}
        />
      )}

      {activeTab === "challenges" && (
        <div className="flex gap-4 overflow-x-auto pb-3">
          {filteredChallenges.map((challenge) => {
            const remaining = Math.max(challenge.ticketCount - challenge.ticketsSold, 0);
            return (
              <article
                key={challenge.id}
                className="flex min-w-[260px] flex-col gap-3 rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
              >
                <header>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Challenge</p>
                  <h3 className="mt-2 text-xl font-semibold text-black">{challenge.name}</h3>
                  {challenge.description && (
                    <p className="text-sm text-gray-600">{challenge.description}</p>
                  )}
                </header>
                <p className="text-xs text-gray-500">
                  {remaining} of {challenge.ticketCount} tickets remain ·{" "}
                  {formatMinis(challenge.ticketPriceMinis ?? 0)} each
                </p>
                <ChallengePurchaseButton challenge={challenge} />
              </article>
            );
          })}
          {!filteredChallenges.length && (
            <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
              {challenges.length === 0
                ? "No challenges available right now. Check back soon."
                : "No challenges match your search."}
            </div>
          )}
        </div>
      )}

      {activeTab !== "mystery-boxes" && activeTab !== "products" && activeTab !== "challenges" && (
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
