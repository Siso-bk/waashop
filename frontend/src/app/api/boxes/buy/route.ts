import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";
import { SESSION_COOKIE } from "@/lib/constants";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Please sign in before buying." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const data = await backendFetch<{ purchaseId: string; rewardMinis: number; tier?: unknown }>("/api/boxes/buy", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to complete purchase";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
