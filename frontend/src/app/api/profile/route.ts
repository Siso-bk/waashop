import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";
import { SESSION_COOKIE } from "@/lib/constants";

const handleError = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : "Unable to process request.";
  return NextResponse.json({ error: message }, { status });
};

export async function GET() {
  try {
    const data = await backendFetch("/api/profile");
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = await backendFetch("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE() {
  try {
    await backendFetch("/api/profile", { method: "DELETE" });
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return handleError(error);
  }
}
