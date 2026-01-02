import PlatformSettings, { IPlatformSettings } from "../models/PlatformSettings";
import { env } from "../config/env";

let cachedSettings: IPlatformSettings | null = null;
let cachedAt = 0;
const CACHE_TTL = 60 * 1000;

export const getPlatformSettings = async () => {
  const now = Date.now();
  if (cachedSettings && now - cachedAt < CACHE_TTL) {
    return cachedSettings;
  }
  let settings = await PlatformSettings.findOne().lean<IPlatformSettings>().exec();
  if (!settings) {
    settings = await PlatformSettings.create({
      feeMysteryBox: env.FEE_MYSTERY_BOX,
      feeChallenge: env.FEE_CHALLENGE,
      feePromoCard: env.FEE_PROMO_CARD,
      feeTopWinnerPercent: env.FEE_TOP_WINNER_PERCENT,
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
