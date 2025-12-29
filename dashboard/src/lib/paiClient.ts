import { env } from "@/lib/env";

const { PAI_BASE_URL } = env;

const parseJson = async <T>(response: Response) => {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = (data as { error?: string; message?: string }).error || data.message || response.statusText;
    throw new Error(message || "PAI request failed");
  }
  return (await response.json()) as T;
};

export const paiFetch = async <T>(path: string, init?: RequestInit & { auth?: string | null }) => {
  const url = path.startsWith("http") ? path : `${PAI_BASE_URL}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (init?.auth) {
    headers.set("Authorization", `Bearer ${init.auth}`);
  }
  const response = await fetch(url, {
    ...init,
    headers,
    cache: init?.cache || "no-store",
  });
  return parseJson<T>(response);
};
