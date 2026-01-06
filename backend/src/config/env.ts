import * as dotenv from "dotenv";

dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  MONGODB_URI: required("MONGODB_URI"),
  TELEGRAM_BOT_TOKEN: required("TELEGRAM_BOT_TOKEN"),
  JWT_SECRET: required("JWT_SECRET"),
  WEBAPP_URL: process.env.WEBAPP_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  CORS_EXTRA_ORIGINS: process.env.CORS_EXTRA_ORIGINS,
  ADMIN_TELEGRAM_IDS: (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
  PAI_BASE_URL: process.env.PAI_BASE_URL,
  PAI_API_KEY: process.env.PAI_API_KEY,
  FEE_MYSTERY_BOX: Number(process.env.FEE_MYSTERY_BOX || 0),
  FEE_MYSTERY_BOX_PERCENT: Number(process.env.FEE_MYSTERY_BOX_PERCENT || 0),
  FEE_CHALLENGE: Number(process.env.FEE_CHALLENGE || 0),
  FEE_JACKPOT_PLAY: Number(process.env.FEE_JACKPOT_PLAY || 0),
  FEE_PROMO_CARD: Number(process.env.FEE_PROMO_CARD || 0),
  FEE_TOP_WINNER_PERCENT: Number(process.env.FEE_TOP_WINNER_PERCENT || 10),
  JACKPOT_PLATFORM_PERCENT: Number(process.env.JACKPOT_PLATFORM_PERCENT || 5),
  JACKPOT_SEED_PERCENT: Number(process.env.JACKPOT_SEED_PERCENT || 10),
  JACKPOT_VENDOR_PERCENT: Number(process.env.JACKPOT_VENDOR_PERCENT || 5),
  JACKPOT_WIN_SOUND_URL: process.env.JACKPOT_WIN_SOUND_URL,
  JACKPOT_LOSE_SOUND_URL: process.env.JACKPOT_LOSE_SOUND_URL,
  TRANSFER_LIMIT_MINIS: Number(process.env.TRANSFER_LIMIT_MINIS || 5000),
  TRANSFER_FEE_PERCENT: Number(process.env.TRANSFER_FEE_PERCENT || 2),
};

export const isProd = env.NODE_ENV === "production";
