import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

const handleError = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : "Unable to process request.";
  return NextResponse.json({ error: message }, { status });
};

export async function GET() {
  try {
    const data = await backendFetch("/api/vendors/products");
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = await backendFetch("/api/vendors/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
