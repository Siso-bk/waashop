import { env } from "@/lib/env";

const PAI_BASE_URL = process.env.NEXT_PUBLIC_PAI_BASE_URL || env.API_BASE_URL;

const parseJson = async <T>(response: Response) => {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = (data as { error?: string; message?: string }).error || data.message || "PAI request failed";
    throw new Error(message);
  }
  return (await response.json()) as T;
};

export const paiFetch = async <T>(path: string, init?: RequestInit) => {
  if (!PAI_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_PAI_BASE_URL");
  }
  const url = path.startsWith("http") ? path : `${PAI_BASE_URL}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const response = await fetch(url, {
    ...init,
    headers,
    cache: init?.cache || "no-store",
  });
  return parseJson<T>(response);
};
