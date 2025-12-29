import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/constants";

const { API_BASE_URL } = env;

const parseJson = async <T>(response: Response) => {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "API request failed");
  }
  return (await response.json()) as T;
};

const authHeaders = () => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const backendFetch = async <T>(path: string, init?: RequestInit & { auth?: boolean }) => {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (init?.auth !== false) {
    const auth = authHeaders();
    Object.entries(auth).forEach(([key, value]) => headers.set(key, value as string));
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: init?.cache || "no-store",
  });

  return parseJson<T>(response);
};
