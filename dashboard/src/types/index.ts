export interface UserProfile {
  id: string;
  telegramId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  minisBalance: number;
  lastTopWinAt?: string;
  roles: string[];
}

export interface VendorProfile {
  _id: string;
  ownerUserId: string;
  name: string;
  description?: string;
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface RewardTierDto {
  minis: number;
  probability: number;
  isTop?: boolean;
}

export interface ProductDto {
  _id: string;
  vendorId: string | { _id: string; name: string };
  name: string;
  description?: string;
  type: "MYSTERY_BOX" | "STANDARD" | "CHALLENGE";
  status: "DRAFT" | "PENDING" | "ACTIVE" | "INACTIVE";
  priceMinis: number;
  guaranteedMinMinis?: number;
  rewardTiers?: RewardTierDto[];
  ticketPriceMinis?: number;
  ticketCount?: number;
  ticketsSold?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse {
  user: UserProfile;
  vendor: VendorProfile | null;
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

export interface PromoCardDto {
  id: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
  status?: string;
}

export interface AdminUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  roles: string[];
  minisBalance: number;
}

export interface PlatformSettingsDto {
  feeMysteryBox: number;
  feeChallenge: number;
  feePromoCard: number;
}

export interface DepositRequestDto {
  id: string;
  userId?: string;
  userEmail?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  amountMinis: number;
  currency?: string;
  paymentMethod: string;
  paymentReference?: string;
  proofUrl?: string;
  note?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  minisCredited?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body?: string;
  meta?: Record<string, unknown>;
  status: "UNREAD" | "READ";
  createdAt: string;
  readAt?: string;
}
