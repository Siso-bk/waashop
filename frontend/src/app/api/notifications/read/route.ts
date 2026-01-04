import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

const handleError = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : "Unable to update notifications.";
  return NextResponse.json({ error: message }, { status });
};

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = await backendFetch<{ updated: number }>("/api/notifications/read", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
