export interface UserProfile {
  id: string;
  telegramId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  coinsBalance: number;
  pointsBalance: number;
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
  points: number;
  probability: number;
  isTop?: boolean;
}

export interface ProductDto {
  _id: string;
  vendorId: string | { _id: string; name: string };
  name: string;
  description?: string;
  type: "MYSTERY_BOX" | "STANDARD";
  status: "DRAFT" | "PENDING" | "ACTIVE" | "INACTIVE";
  priceCoins: number;
  guaranteedMinPoints?: number;
  rewardTiers?: RewardTierDto[];
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
