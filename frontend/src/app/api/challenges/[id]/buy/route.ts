import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backendClient";
import { SESSION_COOKIE } from "@/lib/constants";

type Params = {
  params: { id: string };
};

export async function POST(request: Request, { params }: Params) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Please sign in before buying." }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const data = await backendFetch<{ ok?: boolean }>("/api/challenges/" + params.id + "/buy", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to buy ticket";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
