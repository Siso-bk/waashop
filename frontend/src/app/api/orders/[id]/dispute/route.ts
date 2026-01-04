import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

const handleError = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : "Unable to dispute order.";
  return NextResponse.json({ error: message }, { status });
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = await request.json().catch(() => ({}));
    const data = await backendFetch(`/api/orders/${id}/dispute`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
