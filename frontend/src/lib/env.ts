const optional = (name: string, fallback?: string) => process.env[name] ?? fallback;

const apiBase =
  optional("API_BASE_URL") ||
  optional("NEXT_PUBLIC_API_BASE_URL") ||
  (() => {
    throw new Error("Missing API_BASE_URL or NEXT_PUBLIC_API_BASE_URL");
  })();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  API_BASE_URL: apiBase,
  NEXT_PUBLIC_API_BASE_URL: optional("NEXT_PUBLIC_API_BASE_URL") || apiBase,
};
