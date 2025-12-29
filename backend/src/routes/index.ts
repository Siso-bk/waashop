import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { verifyTelegramInitData, upsertTelegramUser, createSessionToken, serializeUser } from "../services/auth";
import { env, isProd } from "../config/env";
import MysteryBox from "../models/MysteryBox";
import Ledger from "../models/Ledger";
import Purchase from "../models/Purchase";
import User from "../models/User";
import { withMongoSession, connectDB } from "../lib/db";
import { resolveReward } from "../services/rewards";

const router = Router();

router.post("/auth/telegram", async (req, res) => {
  try {
    const bodySchema = z.object({ initData: z.string().min(1) });
    const { initData } = bodySchema.parse(req.body);
    const profile = verifyTelegramInitData(initData);
    const user = await upsertTelegramUser(profile);
    const token = createSessionToken(user._id.toString());
    res.json({ token, user: serializeUser(user) });
  } catch (error) {
    console.error("Auth error", error);
    res.status(400).json({ error: "Invalid Telegram auth" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  const user = req.userDoc!;
  res.json({ user: serializeUser(user) });
});

router.get("/boxes", async (_req, res) => {
  await connectDB();
  const boxes = await MysteryBox.find({ isActive: true }).lean();
  res.json({ boxes });
});

router.post("/boxes/buy", authMiddleware, async (req, res) => {
  const bodySchema = z.object({
    boxId: z.string().min(1),
    purchaseId: z.string().min(1),
  });

  try {
    const { boxId, purchaseId } = bodySchema.parse(req.body);
    await connectDB();

    const existing = await Purchase.findOne({ purchaseId }).exec();
    if (existing) {
      return res.status(409).json({ error: "Purchase already exists" });
    }

    const result = await withMongoSession(async (session) => {
      const userQuery = User.findById(req.userId);
      const boxQuery = MysteryBox.findOne({ boxId, isActive: true });
      if (session) {
        userQuery.session(session);
        boxQuery.session(session);
      }
      const [userDoc, boxDoc] = await Promise.all([userQuery, boxQuery]);

      if (!userDoc) throw new Error("User not found");
      if (!boxDoc) return { error: "Mystery box not found" } as const;
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
      if (session) await purchase.save({ session });
      else await purchase.save();

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

      if (session) {
        await userDoc.save({ session });
        await Ledger.insertMany(ledgerEntries, { session });
      } else {
        await userDoc.save();
        await Ledger.insertMany(ledgerEntries);
      }

      purchase.rewardPoints = rewardPoints;
      purchase.status = "COMPLETED";
      if (session) await purchase.save({ session });
      else await purchase.save();

      return { purchase, userDoc, rewardPoints, tier } as const;
    });

    if ("error" in result) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      purchaseId,
      rewardPoints: result.rewardPoints,
      tier: result.tier,
      balances: {
        coins: result.userDoc.coinsBalance,
        points: result.userDoc.pointsBalance,
      },
    });
  } catch (error) {
    console.error("Buy box error", error);
    res.status(400).json({ error: "Unable to process purchase" });
  }
});

router.get("/ledger", authMiddleware, async (req, res) => {
  const querySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  });

  const params = querySchema.parse(req.query);
  await connectDB();
  const skip = (params.page - 1) * params.limit;
  const [items, total] = await Promise.all([
    Ledger.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .lean(),
    Ledger.countDocuments({ userId: req.userId }),
  ]);

  res.json({
    items,
    page: params.page,
    total,
    pageSize: params.limit,
    hasMore: skip + items.length < total,
  });
});

router.post("/admin/seed", async (req, res) => {
  if (isProd) {
    return res.status(403).json({ error: "Not allowed" });
  }
  await connectDB();
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
    isActive: true,
  };

  await MysteryBox.findOneAndUpdate(
    { boxId: DEFAULT_BOX.boxId },
    { $set: DEFAULT_BOX },
    { upsert: true }
  );

  const telegramId = req.body?.telegramId;
  if (telegramId) {
    await User.findOneAndUpdate(
      { telegramId },
      { $set: { coinsBalance: 5000 }, $setOnInsert: { pointsBalance: 0 } },
      { upsert: true }
    );
  }

  res.json({ ok: true });
});

router.post("/telegram/webhook", async (req, res) => {
  const message = req.body?.message;
  if (message?.text?.startsWith("/start")) {
    const keyboard = env.WEBAPP_URL
      ? {
          keyboard: [
            [
              {
                text: "Open Mystery Wallet",
                web_app: { url: env.WEBAPP_URL },
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        }
      : undefined;

    const welcomeText =
      "Welcome to Mystery Wallet!\nTap the button to launch the Mini App and start opening boxes.";

    const apiUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text: welcomeText,
        reply_markup: keyboard,
      }),
    }).catch((error) => console.error("Telegram sendMessage error", error));
  }

  res.json({ ok: true });
});

export default router;
