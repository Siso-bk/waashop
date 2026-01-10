import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { SESSION_COOKIE } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SignedUploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  viewUrl?: string;
  objectName: string;
};

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload payload." }, { status: 400 });
  }

  const file = formData.get("file");
  const folder = formData.get("folder");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const signResponse = await fetch(`${env.API_BASE_URL}/api/uploads/sign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      folder: typeof folder === "string" ? folder : undefined,
      sizeBytes: file.size,
    }),
  });

  const signData = (await signResponse.json().catch(() => ({}))) as Partial<SignedUploadResponse> & {
    error?: string;
  };

  if (!signResponse.ok || !signData.uploadUrl || !signData.publicUrl) {
    return NextResponse.json({ error: signData.error || "Unable to sign upload." }, { status: 400 });
  }

  const uploadResponse = await fetch(signData.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!uploadResponse.ok) {
    return NextResponse.json({ error: "Upload failed." }, { status: 400 });
  }

  return NextResponse.json({
    publicUrl: signData.publicUrl,
    viewUrl: signData.viewUrl,
    objectName: signData.objectName,
  });
}
