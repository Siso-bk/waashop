import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import MysteryBox from "@/models/MysteryBox";
import User from "@/models/User";
import { isProd } from "@/lib/env";

const DEFAULT_BOX = {
  boxId: "BOX_1000",
  name: "Mystery Points Box",
  priceCoins: 1000,
  guaranteedMinPoints: 600,
  rewardTiers: [
    { points: 600, probability: 0.55 },
    { points: 800, probability: 0.25 },
    { points: 1000, probability: 0.15 },
    { points: 3000, probability: 0.04 },
    { points: 10000, probability: 0.01, isTop: true },
  ],
};

export async function POST(request: Request) {
  if (isProd) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await connectDB();

  await MysteryBox.findOneAndUpdate(
    { boxId: DEFAULT_BOX.boxId },
    { $set: { ...DEFAULT_BOX, isActive: true } },
    { upsert: true }
  );

  const body = await request.json().catch(() => ({}));
  const telegramId = body?.telegramId;

  let seededUser;
  if (telegramId) {
    seededUser = await User.findOneAndUpdate(
      { telegramId },
      { $setOnInsert: { coinsBalance: 5000, pointsBalance: 0 } },
      { new: true, upsert: true }
    );
    if (seededUser) {
      seededUser.coinsBalance = 5000;
      await seededUser.save();
    }
  }

  return NextResponse.json({ ok: true, telegramId: telegramId || null });
}
