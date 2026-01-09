import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

export async function GET() {
  try {
    const data = await backendFetch("/api/jackpots", { auth: false });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load jackpots";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
