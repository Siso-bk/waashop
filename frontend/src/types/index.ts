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
  totalTries?: number;
  triesSold?: number;
  winSoundUrl?: string;
  loseSoundUrl?: string;
}

export interface JackpotPlayDto {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  priceMinis: number;
  winOdds: number;
  poolMinis: number;
  platformPercent: number;
  seedPercent: number;
  vendorPercent: number;
  winSoundUrl?: string;
  loseSoundUrl?: string;
  vendor?: { _id: string; name: string } | string;
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
  winnerUsername?: string;
  winnerTicketNumber?: number;
  prizeConfirmedAt?: string;
  prizeDeliveredAt?: string;
}

export interface ChallengeWin {
  id: string;
  name: string;
  description?: string;
  ticketPriceMinis: number;
  winnerTicketNumber?: number;
  prizeConfirmedAt?: string;
  prizeDeliveredAt?: string;
  prizeClaimedAt?: string;
  prizeRecipientName?: string;
  prizeRecipientPhone?: string;
  prizeRecipientAddress?: string;
  prizeClaimNote?: string;
  updatedAt?: string;
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
  vendorPhone?: string;
  vendorAddress?: string;
  imageUrl?: string;
}

export interface CustomerOrder {
  id: string;
  productId: string;
  status:
    | "PLACED"
    | "PACKED"
    | "SHIPPED"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "COMPLETED"
    | "DISPUTED"
    | "REFUNDED"
    | "CANCELLED"
    | "REJECTED"
    | "DAMAGED"
    | "UNSUCCESSFUL";
  amountMinis: number;
  quantity: number;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  notes?: string;
  trackingCode?: string;
  events?: Array<{
    status: CustomerOrder["status"];
    note?: string;
    actor: "system" | "vendor" | "buyer" | "admin";
    createdAt: string;
  }>;
  placedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  completedAt?: string;
  disputedAt?: string;
  refundedAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
  escrowReleased?: boolean;
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
  imageUrl?: string;
}
