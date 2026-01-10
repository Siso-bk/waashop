import Link from "next/link";
import {
  getActiveBoxes,
  getChallenges,
  getActiveJackpots,
  getSessionUser,
  getStandardProducts,
} from "@/lib/queries";
import { ShopHeader } from "@/components/ShopHeader";
import { ShopTabNav } from "@/components/ShopTabNav";
import { JackpotShowcase } from "@/components/JackpotShowcase";
import { MysteryBoxShowcase } from "@/components/MysteryBoxShowcase";
import { ChallengeShowcase } from "@/components/ChallengeShowcase";
import { SiteTopNav } from "@/components/SiteTopNav";

type SearchParams = Record<string, string | string[] | undefined>;

const FALLBACK_TABS = [
  { key: "jackpot-plays", label: "Jackpots", order: 0 },
  { key: "challenges", label: "Challenges", order: 1 },
  { key: "mystery-boxes", label: "Mystery boxes", order: 2 },
];

export const metadata = {
  title: "Play — Waashop",
  description: "Play jackpots, challenges, and mystery boxes on Waashop.",
  openGraph: {
    title: "Play — Waashop",
    description: "Play jackpots, challenges, and mystery boxes on Waashop.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Play — Waashop",
    description: "Play jackpots, challenges, and mystery boxes on Waashop.",
  },
};

export default async function PlayPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const query = typeof resolvedParams?.q === "string" ? resolvedParams.q.trim() : "";
  const [boxes, jackpots, user, challenges] = await Promise.all([
    getActiveBoxes(),
    getActiveJackpots(),
    getSessionUser(),
    getChallenges(),
  ]);
  const tabKey = typeof resolvedParams?.tab === "string" ? resolvedParams.tab : "";
  const activeTab = FALLBACK_TABS.find((tab) => tab.key === tabKey) ? tabKey : FALLBACK_TABS[0]?.key;
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
  const filteredJackpots =
    activeTab === "jackpot-plays" && activeQuery
      ? jackpots.filter((jackpot) => jackpot.name.toLowerCase().includes(activeQuery))
      : jackpots;

  return (
    <div className="web-shell pb-6">
      <SiteTopNav signedIn={Boolean(user)} />
      <header className="web-panel rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ShopHeader
            activeTab={activeTab}
            initialQuery={query}
            suggestions={[
              ...jackpots.map((jackpot) => jackpot.name),
              ...challenges.map((challenge) => challenge.name),
              ...boxes.map((box) => box.name),
            ]}
            basePath="/play"
            label="Play"
          />
          {!user && (
            <div className="flex flex-col items-start gap-1">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-black bg-[#000] px-4 py-2 text-xs font-semibold text-white transition hover:bg-black/80"
              >
                Sign in to Play
              </Link>
              <p className="text-xs text-[color:var(--app-text-muted)]">Use your email or username@pai.</p>
            </div>
          )}
        </div>
        <ShopTabNav tabs={FALLBACK_TABS} activeTab={activeTab} basePath="/play" />
      </header>

      {activeTab === "jackpot-plays" && (
        <JackpotShowcase jackpots={filteredJackpots} signedIn={Boolean(user)} />
      )}

      {activeTab === "challenges" && (
        <ChallengeShowcase challenges={filteredChallenges} signedIn={Boolean(user)} />
      )}

      {activeTab === "mystery-boxes" && (
        <MysteryBoxShowcase boxes={filteredBoxes} signedIn={Boolean(user)} />
      )}
    </div>
  );
}
