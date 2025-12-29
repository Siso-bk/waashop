import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/constants";

const { API_BASE_URL } = env;

const parseJson = async <T>(response: Response) => {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = (data as { error?: string }).error || response.statusText || "API request failed";
    throw new Error(message);
  }
  return (await response.json()) as T;
};

const getSessionToken = async () => {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
};

export const backendFetch = async <T>(path: string, init?: RequestInit & { auth?: boolean }) => {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (init?.auth !== false) {
    const token = await getSessionToken();
    if (!token) {
      throw new Error("Missing session token");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: init?.cache || "no-store",
  });

  return parseJson<T>(response);
};
