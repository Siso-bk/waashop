import { Schema, model, models, Document } from "mongoose";

export interface IPlatformSettings extends Document {
  feeMysteryBox: number;
  feeMysteryBoxPercent: number;
  feeChallenge: number;
  feeJackpotPlay: number;
  feePromoCard: number;
  feeTopWinnerPercent: number;
  jackpotPlatformPercent: number;
  jackpotSeedPercent: number;
  jackpotVendorPercent: number;
  minisPerUsd: number;
  usdToEtb: number;
  platformPayoutHandle?: string;
  jackpotWinSoundUrl?: string;
  jackpotLoseSoundUrl?: string;
  mysteryBoxWinSoundUrl?: string;
  mysteryBoxLoseSoundUrl?: string;
  reservedHandles?: string[];
  transferLimitMinis: number;
  transferFeePercent: number;
  depositMethodEntries?: {
    key?: string;
    currency: "USD" | "ETB";
    method: "BANK_TRANSFER" | "MOBILE_MONEY" | "WALLET_ADDRESS" | string;
    label?: string;
    accountName?: string;
    accountNumber?: string;
    phoneNumber?: string;
    walletAddress?: string;
    instructions?: string;
  }[];
  payoutMethodEntries?: {
    key?: string;
    currency: "USD" | "ETB";
    method: "BANK_TRANSFER" | "MOBILE_MONEY" | "WALLET_ADDRESS" | string;
    label?: string;
    instructions?: string;
  }[];
  payoutProcessingTimes?: Record<string, string>;
  shopTabs?: {
    key: string;
    label: string;
    order?: number;
    enabled?: boolean;
  }[];
  productCategories?: {
    key: string;
    label: string;
    order?: number;
    enabled?: boolean;
  }[];
}

const DEFAULT_SHOP_TABS = [
  { key: "mystery-boxes", label: "Mystery boxes", order: 0, enabled: true },
  { key: "products", label: "Products", order: 1, enabled: true },
  { key: "challenges", label: "Challenges", order: 2, enabled: true },
  { key: "jackpot-plays", label: "Jackpots play", order: 3, enabled: true },
  { key: "coming-soon", label: "Coming soon", order: 4, enabled: true },
];

const DEFAULT_PRODUCT_CATEGORIES = [
  { key: "apparel", label: "Apparel", order: 0, enabled: true },
  { key: "accessories", label: "Accessories", order: 1, enabled: true },
  { key: "collectibles", label: "Collectibles", order: 2, enabled: true },
  { key: "digital", label: "Digital", order: 3, enabled: true },
];

const DEFAULT_DEPOSIT_METHOD_ENTRIES = [
  { key: "usd-bank-1", currency: "USD", method: "BANK_TRANSFER", label: "Bank transfer" },
  { key: "usd-mobile-1", currency: "USD", method: "MOBILE_MONEY", label: "Mobile money" },
  { key: "usd-wallet-1", currency: "USD", method: "WALLET_ADDRESS", label: "Wallet address" },
  { key: "etb-bank-1", currency: "ETB", method: "BANK_TRANSFER", label: "Bank transfer" },
  { key: "etb-mobile-1", currency: "ETB", method: "MOBILE_MONEY", label: "Mobile money" },
  { key: "etb-wallet-1", currency: "ETB", method: "WALLET_ADDRESS", label: "Wallet address" },
];

const DEFAULT_PAYOUT_METHOD_ENTRIES = [
  { key: "usd-bank-1", currency: "USD", method: "BANK_TRANSFER", label: "Bank transfer" },
  { key: "usd-mobile-1", currency: "USD", method: "MOBILE_MONEY", label: "Mobile money" },
  { key: "usd-wallet-1", currency: "USD", method: "WALLET_ADDRESS", label: "Wallet address" },
  { key: "etb-bank-1", currency: "ETB", method: "BANK_TRANSFER", label: "Bank transfer" },
  { key: "etb-mobile-1", currency: "ETB", method: "MOBILE_MONEY", label: "Mobile money" },
  { key: "etb-wallet-1", currency: "ETB", method: "WALLET_ADDRESS", label: "Wallet address" },
];

const DEFAULT_PAYOUT_PROCESSING_TIMES: Record<string, string> = {
  BANK_TRANSFER: "1–3 business days",
  MOBILE_MONEY: "Same day",
  WALLET_ADDRESS: "Within 24 hours",
  OTHER: "1–3 business days",
};

const PlatformSettingsSchema = new Schema<IPlatformSettings>(
  {
  feeMysteryBox: { type: Number, default: 0 },
  feeMysteryBoxPercent: { type: Number, default: 0 },
  feeChallenge: { type: Number, default: 0 },
  feeJackpotPlay: { type: Number, default: 0 },
    feePromoCard: { type: Number, default: 0 },
    feeTopWinnerPercent: { type: Number, default: 10 },
    jackpotPlatformPercent: { type: Number, default: 5 },
    jackpotSeedPercent: { type: Number, default: 10 },
    jackpotVendorPercent: { type: Number, default: 5 },
    minisPerUsd: { type: Number, default: 100 },
    usdToEtb: { type: Number, default: 120 },
    platformPayoutHandle: { type: String },
    jackpotWinSoundUrl: { type: String },
    jackpotLoseSoundUrl: { type: String },
    mysteryBoxWinSoundUrl: { type: String },
    mysteryBoxLoseSoundUrl: { type: String },
    reservedHandles: { type: [String], default: [] },
    transferLimitMinis: { type: Number, default: 5000 },
    transferFeePercent: { type: Number, default: 2 },
    depositMethodEntries: {
      type: [
        {
          key: { type: String },
          currency: { type: String, required: true },
          method: { type: String, required: true },
          label: { type: String },
          accountName: { type: String },
          accountNumber: { type: String },
          phoneNumber: { type: String },
          walletAddress: { type: String },
          instructions: { type: String },
        },
      ],
      default: DEFAULT_DEPOSIT_METHOD_ENTRIES,
    },
    payoutMethodEntries: {
      type: [
        {
          key: { type: String },
          currency: { type: String, required: true },
          method: { type: String, required: true },
          label: { type: String },
          instructions: { type: String },
        },
      ],
      default: DEFAULT_PAYOUT_METHOD_ENTRIES,
    },
    payoutProcessingTimes: {
      type: Object,
      default: DEFAULT_PAYOUT_PROCESSING_TIMES,
    },
    shopTabs: {
      type: [
        {
          key: { type: String, required: true },
          label: { type: String, required: true },
          order: { type: Number, default: 0 },
          enabled: { type: Boolean, default: true },
        },
      ],
      default: DEFAULT_SHOP_TABS,
    },
    productCategories: {
      type: [
        {
          key: { type: String, required: true },
          label: { type: String, required: true },
          order: { type: Number, default: 0 },
          enabled: { type: Boolean, default: true },
        },
      ],
      default: DEFAULT_PRODUCT_CATEGORIES,
    },
  },
  { timestamps: true }
);

export default models.PlatformSettings || model<IPlatformSettings>("PlatformSettings", PlatformSettingsSchema);
