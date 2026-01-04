import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

const handleError = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : "Unable to fetch orders.";
  return NextResponse.json({ error: message }, { status });
};

export async function GET() {
  try {
    const data = await backendFetch("/api/orders");
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
