import PlatformSettings, { IPlatformSettings } from "../models/PlatformSettings";
import { env } from "../config/env";

let cachedSettings: IPlatformSettings | null = null;
let cachedAt = 0;
const CACHE_TTL = 60 * 1000;
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
