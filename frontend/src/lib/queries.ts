import { backendFetch } from "@/lib/backendClient";
import {
  MysteryBoxDto,
  LedgerEntryDto,
  UserProfile,
  HomeHeroContent,
  HomeHighlightCard,
  PromoCard,
  ChallengeProduct,
  WinnerSpotlightDto,
  ShopTab,
  StandardProduct,
  CustomerOrder,
  NotificationItem,
} from "@/types";

type RawBox = Partial<MysteryBoxDto> & {
  _id?: { toString: () => string } | string;
  priceMinis?: number;
  guaranteedMinMinis?: number;
  rewardTiers?: MysteryBoxDto["rewardTiers"];
};

type RawLedger = LedgerEntryDto & {
  _id?: { toString: () => string } | string;
};

const mapBox = (box: RawBox): MysteryBoxDto => ({
  id: typeof box._id === "string" ? box._id : box._id?.toString?.() ?? box.id ?? "",
  boxId: box.boxId ?? "",
  name: box.name ?? "",
  priceMinis: box.priceMinis ?? 0,
  guaranteedMinMinis: box.guaranteedMinMinis ?? 0,
  rewardTiers: box.rewardTiers ?? [],
});

export const getActiveBoxes = async (): Promise<MysteryBoxDto[]> => {
  const data = await backendFetch<{ boxes: RawBox[] }>("/api/boxes", { auth: false });
  return data.boxes.map(mapBox);
};

export const getBoxByBoxId = async (boxId: string): Promise<MysteryBoxDto | null> => {
  const boxes = await getActiveBoxes();
  return boxes.find((box) => box.boxId === boxId) ?? null;
};

export const getSessionUser = async (): Promise<UserProfile | null> => {
  try {
    const data = await backendFetch<{ user: UserProfile }>("/api/me");
    return data.user;
  } catch {
    return null;
  }
};

export const getRecentLedger = async (limit = 50): Promise<LedgerEntryDto[]> => {
  const data = await backendFetch<{ items: RawLedger[] }>(`/api/ledger?limit=${limit}`);
  return data.items.map((entry) => ({
    id: typeof entry._id === "string" ? entry._id : entry._id?.toString?.() || entry.id,
    deltaMinis: entry.deltaMinis,
    reason: entry.reason,
    meta: entry.meta || {},
    createdAt: entry.createdAt,
  }));
};

const FALLBACK_HOME_HERO: HomeHeroContent = {
  tagline: "Waashop",
  headline: "Mystery drops with honest odds and a wallet that travels with you.",
  description:
    "See the guaranteed minimum, ledger impact, and cooldown before you tap buy. Once you're signed in, the Mini App, desktop web, and dashboard all stay in sync.",
  primaryCtaLabel: "Sign in",
  primaryCtaHref: "/login",
  primaryCtaAuthedLabel: "Continue shopping",
  primaryCtaAuthedHref: "/boxes/BOX_1000",
  secondaryCtaLabel: "Wallet & ledger",
  secondaryCtaHref: "/wallet",
  secondaryCtaAuthedLabel: "Wallet & ledger",
  secondaryCtaAuthedHref: "/wallet",
  backgroundClass: "bg-black",
  textClass: "text-white",
  cards: [
    {
      id: "hero-card-1",
      tagline: "Transparency",
      title: "Verified drops",
      body: "Every box shows the guaranteed minimum before you buy.",
      imageUrl: "",
      overlayOpacity: 0.35,
      ctaLabel: "See drops",
      ctaHref: "/",
      order: 0,
      status: "PUBLISHED",
    },
    {
      id: "hero-card-2",
      tagline: "Always synced",
      title: "Wallet-first",
      body: "MINIS move with you across the Mini App, web, and dashboard.",
      imageUrl: "",
      overlayOpacity: 0.35,
      order: 1,
      status: "PUBLISHED",
    },
    {
      id: "hero-card-3",
      tagline: "Live ledger",
      title: "Instant settlement",
      body: "Wins land in your ledger right away with tamperproof tracking.",
      imageUrl: "",
      overlayOpacity: 0.35,
      order: 2,
      status: "PUBLISHED",
    },
  ],
};

export const getHomeHero = async (): Promise<HomeHeroContent> => {
  try {
    const data = await backendFetch<{ hero: HomeHeroContent }>("/api/home-hero", { auth: false });
    return data.hero;
  } catch {
    return FALLBACK_HOME_HERO;
  }
};

const FALLBACK_HOME_HIGHLIGHTS: HomeHighlightCard[] = [
  {
    key: "new",
    eyebrow: "New shoppers",
    title: "Create once, shop everywhere.",
    description: "Verify your email, set a password, and your identity stays consistent across every surface.",
    guestCtaLabel: "Create profile",
    guestCtaHref: "/login",
    authedCtaLabel: "View wallet",
    authedCtaHref: "/wallet",
  },
  {
    key: "returning",
    eyebrow: "Returning",
    title: "Sign in and resume instantly.",
    description: "Sessions rotate every seven days and Waashop validates them before loading balances or vendor access.",
    guestCtaLabel: "Sign in",
    guestCtaHref: "/login",
    authedCtaLabel: "Join featured box",
    authedCtaHref: "/boxes/BOX_1000",
  },
];

export const getHomeHighlights = async (): Promise<HomeHighlightCard[]> => {
  try {
    const data = await backendFetch<{ cards: HomeHighlightCard[] }>("/api/home-highlights", { auth: false });
    return data.cards;
  } catch {
    return FALLBACK_HOME_HIGHLIGHTS;
  }
};

export const getPromoCards = async (): Promise<PromoCard[]> => {
  try {
    const data = await backendFetch<{ promoCards: PromoCard[] }>("/api/promo-cards", { auth: false });
    return data.promoCards;
  } catch {
    return [];
  }
};

export const getChallenges = async (): Promise<ChallengeProduct[]> => {
  try {
    const data = await backendFetch<{ challenges: ChallengeProduct[] }>("/api/challenges", { auth: false });
    return data.challenges;
  } catch {
    return [];
  }
};

export const getWinners = async (): Promise<WinnerSpotlightDto[]> => {
  try {
    const data = await backendFetch<{ winners: WinnerSpotlightDto[] }>("/api/winners", { auth: false });
    return data.winners;
  } catch {
    return [];
  }
};

export const getShopTabs = async (): Promise<ShopTab[]> => {
  try {
    const data = await backendFetch<{ tabs: ShopTab[] }>("/api/shop-tabs", { auth: false });
    return data.tabs;
  } catch {
    return [];
  }
};

export const getStandardProducts = async (): Promise<StandardProduct[]> => {
  try {
    const data = await backendFetch<{ products: any[] }>("/api/products?type=STANDARD", { auth: false });
    return data.products.map((product) => ({
      id: product.id || product._id || "",
      name: product.name,
      description: product.description,
      priceMinis: product.priceMinis ?? 0,
      vendorName: product.vendorName,
    }));
  } catch {
    return [];
  }
};

export const getCustomerOrders = async (): Promise<CustomerOrder[]> => {
  const data = await backendFetch<{ orders: CustomerOrder[] }>("/api/orders");
  return data.orders;
};

export const getNotifications = async (): Promise<NotificationItem[]> => {
  const data = await backendFetch<{ notifications: NotificationItem[] }>("/api/notifications");
  return data.notifications ?? [];
};
