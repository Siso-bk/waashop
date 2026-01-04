import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

const handleError = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : "Unable to confirm order.";
  return NextResponse.json({ error: message }, { status });
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await backendFetch(`/api/orders/${id}/confirm`, {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
