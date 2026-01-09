import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";

type SignedUploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  objectName: string;
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const response = await backendFetch<SignedUploadResponse>("/api/uploads/sign", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to prepare upload.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
