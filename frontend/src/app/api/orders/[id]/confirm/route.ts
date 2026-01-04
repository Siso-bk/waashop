import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

const handleError = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : "Unable to confirm order.";
  return NextResponse.json({ error: message }, { status });
};

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await backendFetch(`/api/orders/${params.id}/confirm`, {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
