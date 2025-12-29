import { Router } from "express";
import { z } from "zod";
import { authMiddleware, loadVendor, requireApprovedVendor, requireRole } from "../middleware/auth";
import {
  verifyTelegramInitData,
  upsertTelegramUser,
  createSessionToken,
  serializeUser,
} from "../services/auth";
import { env, isProd } from "../config/env";
import Ledger from "../models/Ledger";
import Purchase from "../models/Purchase";
import User from "../models/User";
import Vendor from "../models/Vendor";
import Product from "../models/Product";
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
  const vendor = await Vendor.findOne({ ownerUserId: req.userId }).lean();
  res.json({ user: serializeUser(user), vendor });
});

/** Vendor onboarding */
router.post("/vendors", authMiddleware, async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    description: z.string().max(500).optional(),
  });
  try {
    const payload = schema.parse(req.body);
    await connectDB();
    let vendor = await Vendor.findOne({ ownerUserId: req.userId }).exec();
    if (!vendor) {
      vendor = new Vendor({
        ownerUserId: req.userId,
        name: payload.name,
        description: payload.description,
        status: "PENDING",
      });
    } else {
      vendor.name = payload.name;
      vendor.description = payload.description;
      if (vendor.status === "REJECTED") {
        vendor.status = "PENDING";
      }
    }
    await vendor.save();
    if (!req.userDoc!.roles.includes("vendor")) {
      req.userDoc!.roles.push("vendor");
      await req.userDoc!.save();
    }
    res.json({ vendor });
  } catch (error) {
    console.error("Vendor create error", error);
    res.status(400).json({ error: "Unable to submit vendor profile" });
  }
});

router.get("/vendors/me", authMiddleware, loadVendor, async (req, res) => {
  if (!req.vendorDoc) {
    return res.status(404).json({ error: "Vendor profile not found" });
  }
  res.json({ vendor: req.vendorDoc });
});

router.get(
  "/admin/vendors",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({ status: z.string().optional() });
    const params = schema.parse(req.query);
    await connectDB();
    const query: Record<string, unknown> = {};
    if (params.status) {
      query.status = params.status;
    }
    const vendors = await Vendor.find(query).sort({ createdAt: -1 }).lean();
    res.json({ vendors });
  }
);

router.patch(
  "/admin/vendors/:id/status",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({ status: z.enum(["APPROVED", "SUSPENDED", "REJECTED"]) });
    try {
      const payload = schema.parse(req.body);
      await connectDB();
      const vendor = await Vendor.findById(req.params.id).exec();
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }
      vendor.status = payload.status;
      await vendor.save();
      res.json({ vendor });
    } catch (error) {
      console.error("Vendor status error", error);
      res.status(400).json({ error: "Unable to update vendor status" });
    }
  }
);

/** Product management */
const rewardTierSchema = z.object({
  points: z.number().int().positive(),
  probability: z.number().positive(),
  isTop: z.boolean().optional(),
});

const mysteryBoxSchema = z.object({
  name: z.string().min(2),
  description: z.string().max(500).optional(),
  priceCoins: z.number().int().positive(),
  guaranteedMinPoints: z.number().int().positive(),
  rewardTiers: z.array(rewardTierSchema).min(1),
});

router.post(
  "/vendors/products",
  authMiddleware,
  loadVendor,
  requireApprovedVendor,
  async (req, res) => {
    try {
      const payload = mysteryBoxSchema.parse(req.body);
      const totalProbability = payload.rewardTiers.reduce((acc, tier) => acc + tier.probability, 0);
      if (Math.abs(totalProbability - 1) > 0.01) {
        return res.status(400).json({ error: "Reward probabilities must sum to 1" });
      }
      const product = new Product({
        vendorId: req.vendorDoc!._id,
        name: payload.name,
        description: payload.description,
        priceCoins: payload.priceCoins,
        guaranteedMinPoints: payload.guaranteedMinPoints,
        rewardTiers: payload.rewardTiers,
        type: "MYSTERY_BOX",
        status: "PENDING",
      });
      await product.save();
      res.json({ product });
    } catch (error) {
      console.error("Create product error", error);
      res.status(400).json({ error: "Unable to create product" });
    }
  }
);

router.get(
  "/vendors/products",
  authMiddleware,
  loadVendor,
  requireApprovedVendor,
  async (req, res) => {
    const products = await Product.find({ vendorId: req.vendorDoc!._id }).sort({ createdAt: -1 }).lean();
    res.json({ products });
  }
);

router.get(
  "/admin/products",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.json({ products });
  }
);

router.patch(
  "/admin/products/:id/status",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({ status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]), notes: z.string().optional() });
    try {
      const payload = schema.parse(req.body);
      await connectDB();
      const product = await Product.findById(req.params.id).exec();
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      product.status = payload.status;
      await product.save();
      res.json({ product });
    } catch (error) {
      console.error("Product status error", error);
      res.status(400).json({ error: "Unable to update product status" });
    }
  }
);

router.get("/boxes", async (_req, res) => {
  await connectDB();
  const products = await Product.find({ type: "MYSTERY_BOX", status: "ACTIVE" })
    .populate("vendorId", "name")
    .lean();
  res.json({
    boxes: products.map((product) => ({
      id: product._id.toString(),
      boxId: product._id.toString(),
      name: product.name,
      priceCoins: product.priceCoins,
      guaranteedMinPoints: product.guaranteedMinPoints,
      rewardTiers: product.rewardTiers,
      vendor: product.vendorId,
    })),
  });
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
      const productQuery = Product.findOne({ _id: boxId, status: "ACTIVE", type: "MYSTERY_BOX" });
      if (session) {
        userQuery.session(session);
        productQuery.session(session);
      }
      const [userDoc, product] = await Promise.all([userQuery, productQuery]);

      if (!userDoc) throw new Error("User not found");
      if (!product) return { error: "Mystery box not found" } as const;
      if (userDoc.coinsBalance < product.priceCoins) {
        return { error: "Insufficient balance" } as const;
      }

      const purchase = new Purchase({
        purchaseId,
        userId: userDoc._id,
        boxId,
        priceCoins: product.priceCoins,
        status: "PENDING",
      });
      if (session) await purchase.save({ session });
      else await purchase.save();

      userDoc.coinsBalance -= product.priceCoins;
      const { rewardPoints, awardedTop, tier } = resolveReward(product, userDoc);
      userDoc.pointsBalance += rewardPoints;
      if (awardedTop) {
        userDoc.lastTopWinAt = new Date();
      }

      const ledgerEntries = [
        {
          userId: userDoc._id,
          deltaCoins: -product.priceCoins,
          deltaPoints: 0,
          reason: "BOX_PURCHASE_DEBIT",
          meta: { productId: product._id, purchaseId },
        },
        {
          userId: userDoc._id,
          deltaCoins: 0,
          deltaPoints: rewardPoints,
          reason: "BOX_REWARD_CREDIT",
          meta: { productId: product._id, purchaseId, tierPoints: tier.points },
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

  const user = await User.findOneAndUpdate(
    { telegramId: "999999" },
    { $setOnInsert: { coinsBalance: 10000, pointsBalance: 0, roles: ["customer", "vendor", "admin"] } },
    { upsert: true, new: true }
  );

  let vendor = await Vendor.findOne({ ownerUserId: user._id }).exec();
  if (!vendor) {
    vendor = new Vendor({ ownerUserId: user._id, name: "Seed Vendor", status: "APPROVED" });
    await vendor.save();
  } else if (vendor.status !== "APPROVED") {
    vendor.status = "APPROVED";
    await vendor.save();
  }

  await Product.findOneAndUpdate(
    { name: "Mystery Points Box" },
    {
      vendorId: vendor._id,
      description: "Seeded product",
      priceCoins: 1000,
      guaranteedMinPoints: 600,
      rewardTiers: [
        { points: 600, probability: 0.55 },
        { points: 800, probability: 0.25 },
        { points: 1000, probability: 0.15 },
        { points: 3000, probability: 0.04 },
        { points: 10000, probability: 0.01, isTop: true },
      ],
      type: "MYSTERY_BOX",
      status: "ACTIVE",
    },
    { upsert: true, new: true }
  );

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
