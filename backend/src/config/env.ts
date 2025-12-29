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
  ADMIN_TELEGRAM_IDS: (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
  PAI_BASE_URL: process.env.PAI_BASE_URL,
};

export const isProd = env.NODE_ENV === "production";
