import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import MysteryBox from "@/models/MysteryBox";

export async function GET() {
  await connectDB();
  const boxes = await MysteryBox.find({ isActive: true }).lean();

  return NextResponse.json({
    boxes: boxes.map((box) => ({
      id: box._id.toString(),
      boxId: box.boxId,
      name: box.name,
      priceCoins: box.priceCoins,
      guaranteedMinPoints: box.guaranteedMinPoints,
      rewardTiers: box.rewardTiers,
    })),
  });
}
