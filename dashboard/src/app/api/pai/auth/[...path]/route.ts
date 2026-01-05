import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";

const handleError = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : "Unable to process request.";
  return NextResponse.json({ error: message }, { status });
};

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const payload = await request.json().catch(() => ({}));
    const response = await fetch(`${env.API_BASE_URL}/api/pai/auth/${path.join("/")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleError(error);
  }
}
