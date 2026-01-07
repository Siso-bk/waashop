"use server";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { backendFetch } from "@/lib/backendClient";
import { paiFetch } from "@/lib/paiClient";

export interface ActionState {
  error?: string;
  redirectTo?: string;
}

const persistToken = async (token: string) => {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
};

const syncPortalSession = async (): Promise<ActionState> => {
  try {
    await backendFetch("/api/me");
    return { redirectTo: "/" };
  } catch (error) {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    const message = error instanceof Error ? error.message : "Failed to sync session";
    return { error: message };
  }
};

export const loginAction = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  const email = formData.get("email");
  const password = formData.get("password");
  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return { error: "Email and password are required" };
  }

  try {
    const { token } = await paiFetch<{ token: string; user: unknown }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await persistToken(token);
    return await syncPortalSession();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return { error: message };
  }
};

export const registerAction = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const preToken = formData.get("preToken");
  if (
    !name ||
    typeof name !== "string" ||
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string" ||
    !preToken ||
    typeof preToken !== "string"
  ) {
    return { error: "Complete email verification before creating your account." };
  }

  try {
    const emailValue = email.trim().toLowerCase();
    const handle = normalizeHandleInput(emailValue.split("@")[0] || "");
    if (!handle || !/^[a-z0-9_]{3,32}$/.test(handle)) {
      return { error: "Email must start with 3+ letters or numbers to create a handle." };
    }
    const payload = { preToken, name, handle, password };
    const { token } = await paiFetch<{ token: string; user: unknown }>("/api/auth/pre-signup/complete", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await persistToken(token);
    return await syncPortalSession();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return { error: message };
  }
};

const normalizeHandleInput = (value: string) => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "";
  let normalized = trimmed;
  if (normalized.startsWith("@")) {
    normalized = normalized.slice(1);
  }
  if (normalized.endsWith("@pai")) {
    normalized = normalized.slice(0, -4);
  }
  if (normalized.endsWith(".pai")) {
    normalized = normalized.slice(0, -4);
  }
  return normalized;
};
