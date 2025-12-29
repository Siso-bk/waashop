"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/constants";
import { backendFetch } from "@/lib/backendClient";

interface LoginState {
  error?: string;
}

export const loginAction = async (_prevState: LoginState, formData: FormData): Promise<LoginState> => {
  const rawToken = formData.get("token");
  if (!rawToken || typeof rawToken !== "string") {
    return { error: "Token is required" };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  try {
    await backendFetch("/api/me");
  } catch (error) {
    cookieStore.delete(SESSION_COOKIE);
    const message = error instanceof Error ? error.message : "Invalid token";
    return { error: message };
  }

  redirect("/");
};
