import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/constants";

const COOKIE_TTL = 60 * 60 * 24 * 7;

const buildUrl = (request: NextRequest, target?: string | null) => {
  const base = new URL(request.url);
  if (!target) {
    return new URL(base.origin);
  }
  try {
    const candidate = new URL(target, base.origin);
    if (candidate.origin !== base.origin) {
      return new URL(base.origin);
    }
    return candidate;
  } catch {
    return new URL(base.origin);
  }
};

const fail = (request: NextRequest, message: string) => {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
};

export async function GET(request: NextRequest) {
  const token =
    request.nextUrl.searchParams.get("token") || request.nextUrl.searchParams.get("pai_token");
  if (!token) {
    return fail(request, "Missing Personal AI token.");
  }

  const redirectTarget = request.nextUrl.searchParams.get("redirect") || "/";

  const syncResponse = await fetch(`${env.API_BASE_URL}/api/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!syncResponse.ok) {
    const data = (await syncResponse.json().catch(() => ({}))) as { error?: string };
    return fail(request, data.error || "Unable to sync Personal AI session.");
  }

  const destination = buildUrl(request, redirectTarget);
  const response = NextResponse.redirect(destination);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_TTL,
  });
  return response;
}
