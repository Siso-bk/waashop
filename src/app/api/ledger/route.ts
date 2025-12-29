import { NextResponse } from "next/server";
import { ledgerQuerySchema } from "@/lib/validation";
import { getSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Ledger from "@/models/Ledger";

export async function GET(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = ledgerQuerySchema.parse({
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "50",
  });

  await connectDB();
  const skip = (parsed.page - 1) * parsed.limit;
  const [items, total] = await Promise.all([
    Ledger.find({ userId: sessionUser._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsed.limit)
      .lean(),
    Ledger.countDocuments({ userId: sessionUser._id }),
  ]);

  return NextResponse.json({
    items: items.map((entry) => ({
      id: entry._id.toString(),
      deltaCoins: entry.deltaCoins,
      deltaPoints: entry.deltaPoints,
      reason: entry.reason,
      meta: entry.meta || {},
      createdAt: entry.createdAt,
    })),
    page: parsed.page,
    total,
    pageSize: parsed.limit,
    hasMore: skip + items.length < total,
  });
}
