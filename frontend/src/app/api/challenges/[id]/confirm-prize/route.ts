import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

const handleError = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : "Unable to confirm prize.";
  return NextResponse.json({ error: message }, { status });
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await backendFetch(`/api/challenges/${id}/confirm-prize`, {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
