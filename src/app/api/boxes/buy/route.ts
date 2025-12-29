import { NextResponse } from "next/server";
import { buyBoxSchema } from "@/lib/validation";
import { getSessionUser } from "@/lib/auth";
import { connectDB, withMongoSession } from "@/lib/db";
import MysteryBox from "@/models/MysteryBox";
import Purchase from "@/models/Purchase";
import User from "@/models/User";
import Ledger from "@/models/Ledger";
import { resolveReward } from "@/lib/rewards";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { boxId, purchaseId } = buyBoxSchema.parse(payload);
    await connectDB();

    const existingPurchase = await Purchase.findOne({ purchaseId }).exec();
    if (existingPurchase) {
      if (existingPurchase.userId.toString() !== sessionUser._id.toString()) {
        return NextResponse.json({ error: "Purchase id already used" }, { status: 409 });
      }

      if (existingPurchase.status === "COMPLETED") {
        return NextResponse.json({
          purchaseId: existingPurchase.purchaseId,
          rewardPoints: existingPurchase.rewardPoints,
          status: existingPurchase.status,
        });
      }

      return NextResponse.json(
        { error: "Purchase already in progress", status: existingPurchase.status },
        { status: 409 }
      );
    }

    const result = await withMongoSession(async (session) => {
      const saveOptions = session ? { session } : undefined;

      const userQuery = User.findById(sessionUser._id);
      const boxQuery = MysteryBox.findOne({ boxId, isActive: true });
      if (session) {
        userQuery.session(session);
        boxQuery.session(session);
      }

      const [userDoc, boxDoc] = await Promise.all([userQuery, boxQuery]);

      if (!userDoc) {
        throw new Error("User not found");
      }

      if (!boxDoc) {
        throw new Error("Mystery box not found");
      }

      if (userDoc.coinsBalance < boxDoc.priceCoins) {
        return { error: "Insufficient balance" } as const;
      }

      const purchase = new Purchase({
        purchaseId,
        userId: userDoc._id,
        boxId: boxDoc.boxId,
        priceCoins: boxDoc.priceCoins,
        status: "PENDING",
      });

      if (saveOptions) {
        await purchase.save(saveOptions);
      } else {
        await purchase.save();
      }

      userDoc.coinsBalance -= boxDoc.priceCoins;
      const { rewardPoints, awardedTop, tier } = resolveReward(boxDoc, userDoc);
      userDoc.pointsBalance += rewardPoints;
      if (awardedTop) {
        userDoc.lastTopWinAt = new Date();
      }

      const ledgerEntries = [
        {
          userId: userDoc._id,
          deltaCoins: -boxDoc.priceCoins,
          deltaPoints: 0,
          reason: "BOX_PURCHASE_DEBIT",
          meta: { boxId: boxDoc.boxId, purchaseId },
        },
        {
          userId: userDoc._id,
          deltaCoins: 0,
          deltaPoints: rewardPoints,
          reason: "BOX_REWARD_CREDIT",
          meta: { boxId: boxDoc.boxId, purchaseId, tierPoints: tier.points },
        },
      ];

      if (saveOptions) {
        await userDoc.save(saveOptions);
      } else {
        await userDoc.save();
      }
      if (session) {
        await Ledger.insertMany(ledgerEntries, { session });
      } else {
        await Ledger.insertMany(ledgerEntries);
      }

      purchase.rewardPoints = rewardPoints;
      purchase.status = "COMPLETED";
      if (saveOptions) {
        await purchase.save(saveOptions);
      } else {
        await purchase.save();
      }

      return {
        purchase,
        user: userDoc,
        rewardPoints,
        tier,
      } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      purchaseId,
      rewardPoints: result.rewardPoints,
      tier: result.tier,
      balances: {
        coins: result.user.coinsBalance,
        points: result.user.pointsBalance,
      },
    });
  } catch (error) {
    console.error("Purchase error", error);
    return NextResponse.json({ error: "Failed to process purchase" }, { status: 400 });
  }
}
