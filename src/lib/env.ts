const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

export const env = {
  MONGODB_URI: required("MONGODB_URI"),
  TELEGRAM_BOT_TOKEN: required("TELEGRAM_BOT_TOKEN"),
  JWT_SECRET: required("JWT_SECRET"),
  NODE_ENV: process.env.NODE_ENV || "development",
  WEBAPP_URL: process.env.WEBAPP_URL,
};

export const isProd = env.NODE_ENV === "production";
