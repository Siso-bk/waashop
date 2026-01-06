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
  imageUrl?: string;
  type: "MYSTERY_BOX" | "STANDARD" | "CHALLENGE" | "JACKPOT_PLAY";
  status: "DRAFT" | "PENDING" | "ACTIVE" | "INACTIVE";
  priceMinis: number;
  guaranteedMinMinis?: number;
  rewardTiers?: RewardTierDto[];
  boxTotalTries?: number;
  boxTriesSold?: number;
  boxFundingMinis?: number;
  boxPoolRemaining?: number;
  jackpotWinOdds?: number;
  jackpotPoolMinis?: number;
  jackpotSeedPercent?: number;
  jackpotPlatformPercent?: number;
  jackpotVendorPercent?: number;
  jackpotLastWinAt?: string;
  ticketPriceMinis?: number;
  ticketCount?: number;
  ticketsSold?: number;
  challengeWinnerUserId?: string;
  challengeWinnerUsername?: string;
  challengeWinnerTicketNumber?: number;
  challengeWinnerConfirmedAt?: string;
  challengePrizeDeliveredAt?: string;
  challengePrizeRecipientName?: string;
  challengePrizeRecipientPhone?: string;
  challengePrizeRecipientAddress?: string;
  challengePrizeClaimNote?: string;
  challengePrizeClaimedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDto {
  id: string;
  buyerId: string;
  vendorId: string;
  vendorOwnerId: string;
  productId: string;
  productType: "STANDARD";
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
    status: OrderDto["status"];
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
  escrowReleased?: boolean;
  disputeId?: string;
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
  feeMysteryBoxPercent: number;
  feeChallenge: number;
  feeJackpotPlay: number;
  feePromoCard: number;
  feeTopWinnerPercent: number;
  jackpotPlatformPercent: number;
  jackpotSeedPercent: number;
  jackpotVendorPercent: number;
  platformPayoutHandle?: string;
  jackpotWinSoundUrl?: string;
  jackpotLoseSoundUrl?: string;
  transferLimitMinis: number;
  transferFeePercent: number;
}

export interface ShopTabDto {
  key: string;
  label: string;
  order?: number;
  enabled?: boolean;
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

export interface WithdrawalRequestDto {
  id: string;
  userId?: string;
  userEmail?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  amountMinis: number;
  payoutMethod: string;
  payoutAddress?: string;
  accountName?: string;
  note?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransferRequestDto {
  id: string;
  senderId: string;
  recipientId: string;
  recipientHandle: string;
  senderEmail?: string;
  senderUsername?: string;
  senderName?: string;
  recipientEmail?: string;
  recipientUsername?: string;
  recipientName?: string;
  amountMinis: number;
  feeMinis: number;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  note?: string;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
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

export interface LedgerEntryDto {
  id: string;
  deltaMinis: number;
  reason: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}
