import PlatformSettings, { IPlatformSettings } from "../models/PlatformSettings";
import { env } from "../config/env";

let cachedSettings: IPlatformSettings | null = null;
let cachedAt = 0;
const CACHE_TTL = 0;
const DEFAULT_RESERVED_HANDLES = [
  "admin",
  "support",
  "help",
  "waashop",
  "wallet",
  "info",
  "notifications",
];

export const getPlatformSettings = async () => {
  const now = Date.now();
  if (cachedSettings && now - cachedAt < CACHE_TTL) {
    return cachedSettings;
  }
  let settings = await PlatformSettings.findOne().lean<IPlatformSettings>().exec();
  if (!settings) {
    settings = await PlatformSettings.create({
      feeMysteryBox: env.FEE_MYSTERY_BOX,
      feeMysteryBoxPercent: env.FEE_MYSTERY_BOX_PERCENT,
      feeChallenge: env.FEE_CHALLENGE,
      feeJackpotPlay: env.FEE_JACKPOT_PLAY,
      feePromoCard: env.FEE_PROMO_CARD,
      feeTopWinnerPercent: env.FEE_TOP_WINNER_PERCENT,
      jackpotPlatformPercent: env.JACKPOT_PLATFORM_PERCENT,
      jackpotSeedPercent: env.JACKPOT_SEED_PERCENT,
      jackpotVendorPercent: env.JACKPOT_VENDOR_PERCENT,
      minisPerUsd: env.MINIS_PER_USD,
      usdToEtb: env.USD_TO_ETB,
      jackpotWinSoundUrl: env.JACKPOT_WIN_SOUND_URL,
      jackpotLoseSoundUrl: env.JACKPOT_LOSE_SOUND_URL,
      mysteryBoxWinSoundUrl: env.MYSTERY_BOX_WIN_SOUND_URL,
      mysteryBoxLoseSoundUrl: env.MYSTERY_BOX_LOSE_SOUND_URL,
      reservedHandles: DEFAULT_RESERVED_HANDLES,
      transferLimitMinis: env.TRANSFER_LIMIT_MINIS,
      transferFeePercent: env.TRANSFER_FEE_PERCENT,
      depositMethodEntries: [
        { key: "usd-bank-1", currency: "USD", method: "BANK_TRANSFER", label: "Bank transfer" },
        { key: "usd-mobile-1", currency: "USD", method: "MOBILE_MONEY", label: "Mobile money" },
        { key: "usd-wallet-1", currency: "USD", method: "WALLET_ADDRESS", label: "Wallet address" },
        { key: "etb-bank-1", currency: "ETB", method: "BANK_TRANSFER", label: "Bank transfer" },
        { key: "etb-mobile-1", currency: "ETB", method: "MOBILE_MONEY", label: "Mobile money" },
        { key: "etb-wallet-1", currency: "ETB", method: "WALLET_ADDRESS", label: "Wallet address" },
      ],
      payoutMethodEntries: [
        { key: "usd-bank-1", currency: "USD", method: "BANK_TRANSFER", label: "Bank transfer" },
        { key: "usd-mobile-1", currency: "USD", method: "MOBILE_MONEY", label: "Mobile money" },
        { key: "usd-wallet-1", currency: "USD", method: "WALLET_ADDRESS", label: "Wallet address" },
        { key: "etb-bank-1", currency: "ETB", method: "BANK_TRANSFER", label: "Bank transfer" },
        { key: "etb-mobile-1", currency: "ETB", method: "MOBILE_MONEY", label: "Mobile money" },
        { key: "etb-wallet-1", currency: "ETB", method: "WALLET_ADDRESS", label: "Wallet address" },
      ],
      payoutProcessingTimes: {
        BANK_TRANSFER: "1–3 business days",
        MOBILE_MONEY: "Same day",
        WALLET_ADDRESS: "Within 24 hours",
      },
    });
  }
  cachedSettings = settings as IPlatformSettings;
  cachedAt = now;
  return cachedSettings;
};

export const updatePlatformSettings = async (updates: Partial<IPlatformSettings>) => {
  const doc = await PlatformSettings.findOneAndUpdate({}, updates, { new: true, upsert: true, setDefaultsOnInsert: true });
  cachedSettings = doc;
  cachedAt = Date.now();
  return doc;
};
