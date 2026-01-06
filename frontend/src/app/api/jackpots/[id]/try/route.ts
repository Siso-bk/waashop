import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";
import { SESSION_COOKIE } from "@/lib/constants";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Please sign in before trying." }, { status: 401 });
  }

  try {
    const data = await backendFetch(`/api/jackpots/${id}/try`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to try jackpot";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
