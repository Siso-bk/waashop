"use server";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { backendFetch } from "@/lib/backendClient";
import { paiFetch } from "@/lib/paiClient";

export interface AuthActionState {
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

const syncSession = async (): Promise<AuthActionState> => {
  try {
    await backendFetch("/api/me");
    return { redirectTo: "/" };
  } catch (error) {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    const message = error instanceof Error ? error.message : "Failed to sync wallet";
    return { error: message };
  }
};

export const loginAction = async (_prev: AuthActionState, formData: FormData): Promise<AuthActionState> => {
  const identifier = formData.get("identifier");
  const password = formData.get("password");
  if (!identifier || typeof identifier !== "string" || !password || typeof password !== "string") {
    return { error: "Email/username and password are required" };
  }

  try {
    const normalized = identifier.trim().toLowerCase();
    const { token } = await backendFetch<{ token: string; user: unknown }>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ identifier: normalized, password }),
    });
    await persistToken(token);
    return await syncSession();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return { error: message };
  }
};

export const registerAction = async (_prev: AuthActionState, formData: FormData): Promise<AuthActionState> => {
  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const username = formData.get("username");
  const email = formData.get("email");
  const password = formData.get("password");
  const preToken = formData.get("preToken");
  if (
    !firstName ||
    typeof firstName !== "string" ||
    !lastName ||
    typeof lastName !== "string" ||
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string" ||
    !preToken ||
    typeof preToken !== "string"
  ) {
    return { error: "Complete all fields before creating your account." };
  }

  try {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return { error: "First and last name must be at least 2 characters." };
    }
    if (!normalizedUsername) {
      return { error: "Username is required." };
    }
    if (!/^[a-z0-9_]{3,32}$/.test(normalizedUsername)) {
      return { error: "Username must be 3-32 characters, letters/numbers/underscore only." };
    }
    if (password.trim().length < 6) {
      return { error: "Password must be at least 6 characters." };
    }
    const availability = await backendFetch<{
      valid?: boolean;
      available?: boolean;
      reserved?: boolean;
    }>(`/api/profile/handle/check?handle=${encodeURIComponent(normalizedUsername)}`, {
      auth: false,
    });
    if (availability.reserved) {
      return { error: "That username is reserved." };
    }
    if (!availability.valid || availability.available === false) {
      return { error: "That username is already taken." };
    }
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
    if (normalizedUsername) {
      await backendFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: normalizedUsername,
        }),
      });
    } else {
      await backendFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });
    }
    return await syncSession();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    if (message.toLowerCase().includes("invalid input")) {
      return { error: "Invalid input. Check your name and password." };
    }
    return { error: message };
  }
};
