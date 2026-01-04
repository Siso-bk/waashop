export interface RewardTier {
  minis: number;
  probability: number;
  isTop?: boolean;
}

export interface MysteryBoxDto {
  id: string;
  boxId: string;
  name: string;
  priceMinis: number;
  guaranteedMinMinis: number;
  rewardTiers: RewardTier[];
}

export interface LedgerEntryDto {
  id: string;
  deltaMinis: number;
  reason: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  telegramId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  minisBalance: number;
  lastTopWinAt?: string;
  roles?: string[];
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface HomeHeroContent {
  tagline: string;
  headline: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  primaryCtaAuthedLabel?: string;
  primaryCtaAuthedHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  secondaryCtaAuthedLabel?: string;
  secondaryCtaAuthedHref?: string;
  backgroundClass?: string;
  textClass?: string;
  cards?: HomeHeroCard[];
}

export interface HomeHeroCard {
  id: string;
  tagline?: string;
  title: string;
  body: string;
  imageUrl?: string;
  overlayOpacity?: number;
  ctaLabel?: string;
  ctaHref?: string;
  order?: number;
  status?: "DRAFT" | "PUBLISHED";
}

export interface HomeHighlightCard {
  key: string;
  eyebrow?: string;
  title: string;
  description?: string;
  guestCtaLabel?: string;
  guestCtaHref?: string;
  authedCtaLabel?: string;
  authedCtaHref?: string;
  backgroundClass?: string;
  textClass?: string;
  borderClass?: string;
}

export interface PromoCard {
  id: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
}

export interface ChallengeProduct {
  id: string;
  name: string;
  description?: string;
  ticketPriceMinis: number;
  ticketCount: number;
  ticketsSold: number;
  vendor?: { _id: string; name: string } | string;
  winnerUserId?: string;
}

export interface ShopTab {
  key: string;
  label: string;
  order?: number;
  enabled?: boolean;
}

export interface StandardProduct {
  id: string;
  name: string;
  description?: string;
  priceMinis: number;
  vendorName?: string;
}

export interface CustomerOrder {
  id: string;
  productId: string;
  status: "PLACED" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "DISPUTED" | "REFUNDED" | "CANCELLED";
  amountMinis: number;
  quantity: number;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  notes?: string;
  trackingCode?: string;
  placedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  disputedAt?: string;
  refundedAt?: string;
  cancelledAt?: string;
}

export interface NotificationItem {
  id: string;
  type?: string;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
  status: "UNREAD" | "READ";
  createdAt: string;
  readAt?: string;
}

export interface WinnerSpotlightDto {
  id: string;
  winnerType: "CHALLENGE" | "MYSTERY_BOX";
  winnerName: string;
  headline: string;
  description?: string;
}
