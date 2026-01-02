import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/constants";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Please sign in before buying." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const response = await fetch(`${env.API_BASE_URL}/api/boxes/buy`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to complete purchase";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
