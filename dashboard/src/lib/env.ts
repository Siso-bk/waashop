const optional = (key: string) => process.env[key];

const apiBase =
  optional("API_BASE_URL") ||
  optional("NEXT_PUBLIC_API_BASE_URL") ||
  (() => {
    throw new Error("Missing API_BASE_URL or NEXT_PUBLIC_API_BASE_URL");
  })();

const paiBase = optional("PAI_BASE_URL") || (() => {
  throw new Error("Missing PAI_BASE_URL");
})();

export const env = {
  API_BASE_URL: apiBase,
  NEXT_PUBLIC_API_BASE_URL: optional("NEXT_PUBLIC_API_BASE_URL") || apiBase,
  PAI_BASE_URL: paiBase,
};
