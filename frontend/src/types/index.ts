export interface RewardTier {
  points: number;
  probability: number;
  isTop?: boolean;
}

export interface MysteryBoxDto {
  id: string;
  boxId: string;
  name: string;
  priceCoins: number;
  guaranteedMinPoints: number;
  rewardTiers: RewardTier[];
}

export interface LedgerEntryDto {
  id: string;
  deltaCoins: number;
  deltaPoints: number;
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
  coinsBalance: number;
  pointsBalance: number;
  lastTopWinAt?: string;
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
  ticketPriceCoins: number;
  ticketCount: number;
  ticketsSold: number;
  vendor?: { _id: string; name: string } | string;
  winnerUserId?: string;
}

export interface WinnerSpotlightDto {
  id: string;
  winnerType: "CHALLENGE" | "MYSTERY_BOX";
  winnerName: string;
  headline: string;
  description?: string;
}
