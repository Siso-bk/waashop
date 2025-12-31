"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/constants";
import { backendFetch } from "@/lib/backendClient";
import { paiFetch } from "@/lib/paiClient";

interface ActionState {
  error?: string;
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

const syncSession = async (): Promise<ActionState> => {
  try {
    await backendFetch("/api/me");
    redirect("/");
  } catch (error) {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    const message = error instanceof Error ? error.message : "Failed to sync wallet";
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
    return await syncSession();
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
    const payload = {
      preToken,
      name,
      password,
    };
    const { token } = await paiFetch<{ token: string; user: unknown }>("/api/auth/pre-signup/complete", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await persistToken(token);
    return await syncSession();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return { error: message };
  }
};
