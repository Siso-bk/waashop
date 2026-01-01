import { Router } from "express";
import { Types } from "mongoose";
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
import User, { IUser } from "../models/User";
import Vendor from "../models/Vendor";
import Product from "../models/Product";
import HeroContent, { IHeroContent } from "../models/HeroContent";
import HomeHighlights, { IHomeHighlights } from "../models/HomeHighlights";
import PromoCard, { IPromoCard } from "../models/PromoCard";
import ChallengeEntry from "../models/ChallengeEntry";
import WinnerSpotlight, { WinnerType } from "../models/WinnerSpotlight";
import { getPlatformSettings, updatePlatformSettings } from "../services/settings";
import { withMongoSession, connectDB } from "../lib/db";
import { resolveReward } from "../services/rewards";

const router = Router();

const DEFAULT_HOME_HERO = {
  tagline: "Waashop",
  headline: "Mystery drops with honest odds and a wallet that travels with you.",
  description:
    "See the guaranteed minimum, ledger impact, and cooldown before you tap buy. Once you're signed in, the Mini App, desktop web, and dashboard all stay in sync.",
  primaryCtaLabel: "Sign in",
  primaryCtaHref: "/login",
  primaryCtaAuthedLabel: "Continue shopping",
  primaryCtaAuthedHref: "/boxes/BOX_1000",
  secondaryCtaLabel: "Wallet & ledger",
  secondaryCtaHref: "/wallet",
  secondaryCtaAuthedLabel: "Wallet & ledger",
  secondaryCtaAuthedHref: "/wallet",
  backgroundClass: "bg-black",
  textClass: "text-white",
};

type HeroResponse = typeof DEFAULT_HOME_HERO;

const serializeHero = (hero?: Partial<IHeroContent> | null): HeroResponse => ({
  tagline: hero?.tagline ?? DEFAULT_HOME_HERO.tagline,
  headline: hero?.headline ?? DEFAULT_HOME_HERO.headline,
  description: hero?.description ?? DEFAULT_HOME_HERO.description,
  primaryCtaLabel: hero?.primaryCtaLabel ?? DEFAULT_HOME_HERO.primaryCtaLabel,
  primaryCtaHref: hero?.primaryCtaHref ?? DEFAULT_HOME_HERO.primaryCtaHref,
  primaryCtaAuthedLabel: hero?.primaryCtaAuthedLabel ?? DEFAULT_HOME_HERO.primaryCtaAuthedLabel,
  primaryCtaAuthedHref: hero?.primaryCtaAuthedHref ?? DEFAULT_HOME_HERO.primaryCtaAuthedHref,
  secondaryCtaLabel: hero?.secondaryCtaLabel ?? DEFAULT_HOME_HERO.secondaryCtaLabel,
  secondaryCtaHref: hero?.secondaryCtaHref ?? DEFAULT_HOME_HERO.secondaryCtaHref,
  secondaryCtaAuthedLabel: hero?.secondaryCtaAuthedLabel ?? DEFAULT_HOME_HERO.secondaryCtaAuthedLabel,
  secondaryCtaAuthedHref: hero?.secondaryCtaAuthedHref ?? DEFAULT_HOME_HERO.secondaryCtaAuthedHref,
  backgroundClass: hero?.backgroundClass ?? DEFAULT_HOME_HERO.backgroundClass,
  textClass: hero?.textClass ?? DEFAULT_HOME_HERO.textClass,
});

const DEFAULT_HOME_HIGHLIGHTS = [
  {
    key: "new",
    eyebrow: "New shoppers",
    title: "Create once, shop everywhere.",
    description: "Verify your email, set a password, and your identity stays consistent across every surface.",
    guestCtaLabel: "Create profile",
    guestCtaHref: "/login",
    authedCtaLabel: "View wallet",
    authedCtaHref: "/wallet",
    backgroundClass: "bg-white",
    borderClass: "border-black/10",
    textClass: "text-black",
  },
  {
    key: "returning",
    eyebrow: "Returning",
    title: "Sign in and resume instantly.",
    description: "Sessions rotate every seven days and Waashop validates them before loading balances or vendor access.",
    guestCtaLabel: "Sign in",
    guestCtaHref: "/login",
    authedCtaLabel: "Open featured box",
    authedCtaHref: "/boxes/BOX_1000",
    backgroundClass: "bg-white",
    borderClass: "border-black/10",
    textClass: "text-black",
  },
];

type HighlightsResponse = typeof DEFAULT_HOME_HIGHLIGHTS;

const serializeHighlights = (doc?: IHomeHighlights | null): HighlightsResponse => {
  if (!doc?.cards?.length) {
    return DEFAULT_HOME_HIGHLIGHTS;
  }
  const defaultsByKey = Object.fromEntries(DEFAULT_HOME_HIGHLIGHTS.map((card) => [card.key, card]));
  return doc.cards.map((card) => ({
    ...defaultsByKey[card.key]!,
    ...card,
  }));
};

const serializePromoCard = (card: IPromoCard) => ({
  id: card._id.toString(),
  vendorId: card.vendorId,
  title: card.title,
  description: card.description,
  ctaLabel: card.ctaLabel,
  ctaHref: card.ctaHref,
  imageUrl: card.imageUrl,
  status: card.status,
});

const chargeSubmissionFee = async (
  user: IUser,
  amount: number,
  reason: string,
  meta: Record<string, unknown>
) => {
  if (!amount || amount <= 0) return;
  if (user.coinsBalance < amount) {
    throw new Error("Insufficient balance to pay submission fee");
  }
  user.coinsBalance -= amount;
  await user.save();
  await Ledger.create({
    userId: user._id,
    deltaCoins: -amount,
    deltaPoints: 0,
    reason,
    meta,
  });
};

const forwardPaiRequest = async (path: string, payload: unknown) => {
  if (!env.PAI_BASE_URL) {
    return { ok: false, status: 400, data: { error: "PAI integration not configured" } };
  }
  try {
    const response = await fetch(`${env.PAI_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      const error = data.error || data.message || "PAI request failed";
      return { ok: false, status: response.status, data: { error } };
    }
    return { ok: true, status: 200, data };
  } catch (error) {
    console.error("PAI proxy error", error);
    return { ok: false, status: 400, data: { error: "Unable to reach Personal AI" } };
  }
};

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

router.post("/auth/email-status", async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  try {
    const { email } = schema.parse(req.body);
    await connectDB();
    const existing = await User.findOne({ email }).lean();
    res.json({ exists: Boolean(existing) });
  } catch (error) {
    console.error("Email status error", error);
    res.status(400).json({ error: "Unable to check email" });
  }
});

router.post("/auth/forgot", async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  if (!env.PAI_BASE_URL) {
    return res.status(400).json({ error: "PAI integration not configured" });
  }
  try {
    const { email } = schema.parse(req.body);
    const response = await fetch(`${env.PAI_BASE_URL}/api/auth/forgot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier: email }),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || data.message || "Password reset failed" });
    }
    res.json(data);
  } catch (error) {
    console.error("Forgot password error", error);
    res.status(400).json({ error: "Unable to request password reset" });
  }
});

router.post("/auth/reset", async (req, res) => {
  const schema = z.object({ token: z.string().min(1), password: z.string().min(6) });
  if (!env.PAI_BASE_URL) {
    return res.status(400).json({ error: "PAI integration not configured" });
  }
  try {
    const payload = schema.parse(req.body);
    const response = await fetch(`${env.PAI_BASE_URL}/api/auth/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || data.message || "Reset failed" });
    }
    res.json(data);
  } catch (error) {
    console.error("Reset password error", error);
    res.status(400).json({ error: "Unable to reset password" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  const user = req.userDoc!;
  const vendor = await Vendor.findOne({ ownerUserId: req.userId }).lean();
  res.json({ user: serializeUser(user), vendor });
});

router.get("/profile", authMiddleware, async (req, res) => {
  res.json({ profile: serializeUser(req.userDoc!) });
});

router.patch("/profile", authMiddleware, async (req, res) => {
  const schema = z.object({
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    username: z.string().max(100).optional(),
  });
  try {
    const payload = schema.parse(req.body);
    const user = req.userDoc!;
    Object.assign(user, payload);
    await user.save();
    res.json({ profile: serializeUser(user) });
  } catch (error) {
    console.error("Profile update error", error);
    res.status(400).json({ error: "Unable to update profile" });
  }
});

router.get("/home-hero", async (_req, res) => {
  await connectDB();
  const hero = await HeroContent.findOne({ slug: "home" }).lean();
  res.json({ hero: serializeHero(hero) });
});

router.get("/admin/home-hero", authMiddleware, requireRole("admin"), async (_req, res) => {
  await connectDB();
  const hero = await HeroContent.findOne({ slug: "home" }).lean();
  res.json({ hero: serializeHero(hero) });
});

router.put("/admin/home-hero", authMiddleware, requireRole("admin"), async (req, res) => {
  const schema = z.object({
    tagline: z.string().max(150),
    headline: z.string().max(250),
    description: z.string().max(500),
    primaryCtaLabel: z.string().max(80),
    primaryCtaHref: z.string().max(200),
    primaryCtaAuthedLabel: z.string().max(80).optional(),
    primaryCtaAuthedHref: z.string().max(200).optional(),
    secondaryCtaLabel: z.string().max(80).optional(),
    secondaryCtaHref: z.string().max(200).optional(),
    secondaryCtaAuthedLabel: z.string().max(80).optional(),
    secondaryCtaAuthedHref: z.string().max(200).optional(),
    backgroundClass: z.string().max(120).optional(),
    textClass: z.string().max(120).optional(),
  });
  try {
    const payload = schema.parse(req.body);
    await connectDB();
    const hero = await HeroContent.findOneAndUpdate(
      { slug: "home" },
      { slug: "home", ...payload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ hero: serializeHero(hero) });
  } catch (error) {
    console.error("Home hero update error", error);
    res.status(400).json({ error: "Unable to update home hero" });
  }
});

router.get("/home-highlights", async (_req, res) => {
  await connectDB();
  const highlights = await HomeHighlights.findOne({ slug: "home" }).lean();
  res.json({ cards: serializeHighlights(highlights) });
});

router.get("/admin/home-highlights", authMiddleware, requireRole("admin"), async (_req, res) => {
  await connectDB();
  const highlights = await HomeHighlights.findOne({ slug: "home" }).lean();
  res.json({ cards: serializeHighlights(highlights) });
});

router.put("/admin/home-highlights", authMiddleware, requireRole("admin"), async (req, res) => {
  const cardSchema = z.object({
    key: z.string().min(1),
    eyebrow: z.string().max(150).optional(),
    title: z.string().max(200),
    description: z.string().max(400).optional(),
    guestCtaLabel: z.string().max(80).optional(),
    guestCtaHref: z.string().max(200).optional(),
    authedCtaLabel: z.string().max(80).optional(),
    authedCtaHref: z.string().max(200).optional(),
    backgroundClass: z.string().max(120).optional(),
    textClass: z.string().max(120).optional(),
    borderClass: z.string().max(120).optional(),
  });
  const schema = z.object({
    cards: z.array(cardSchema).min(1),
  });
  try {
    const payload = schema.parse(req.body);
    await connectDB();
    const doc = await HomeHighlights.findOneAndUpdate(
      { slug: "home" },
      { slug: "home", cards: payload.cards },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ cards: serializeHighlights(doc) });
  } catch (error) {
    console.error("Home highlights update error", error);
    res.status(400).json({ error: "Unable to update home highlights" });
  }
});

router.post(
  "/vendors/promo-cards",
  authMiddleware,
  loadVendor,
  requireApprovedVendor,
  async (req, res) => {
    const schema = z.object({
      title: z.string().min(5),
      description: z.string().max(400).optional(),
      ctaLabel: z.string().max(60).optional(),
      ctaHref: z.string().max(200).optional(),
      imageUrl: z.string().url().optional(),
    });
    try {
      const payload = schema.parse(req.body);
      const settings = await getPlatformSettings();
      await chargeSubmissionFee(req.userDoc!, settings.feePromoCard || 0, "PROMO_CARD_SUBMISSION_FEE", {
        title: payload.title,
      });
      await connectDB();
      const card = new PromoCard({
        vendorId: req.vendorDoc!._id,
        title: payload.title,
        description: payload.description,
        ctaLabel: payload.ctaLabel,
        ctaHref: payload.ctaHref,
        imageUrl: payload.imageUrl,
        status: "PENDING",
      });
      await card.save();
      res.json({ promoCard: serializePromoCard(card) });
    } catch (error) {
      console.error("Create promo card error", error);
      res.status(400).json({ error: "Unable to submit promo card" });
    }
  }
);

router.patch(
  "/vendors/promo-cards/:id",
  authMiddleware,
  loadVendor,
  requireApprovedVendor,
  async (req, res) => {
    const schema = z.object({
      title: z.string().min(5),
      description: z.string().max(400).optional(),
      ctaLabel: z.string().max(60).optional(),
      ctaHref: z.string().max(200).optional(),
      imageUrl: z.string().url().optional(),
    });
    try {
      const payload = schema.parse(req.body);
      await connectDB();
      const card = await PromoCard.findOne({ _id: req.params.id, vendorId: req.vendorDoc!._id }).exec();
      if (!card) {
        return res.status(404).json({ error: "Promo card not found" });
      }
      if (card.status !== "PENDING") {
        return res.status(400).json({ error: "Only pending promo cards can be edited" });
      }
      Object.assign(card, payload);
      await card.save();
      res.json({ promoCard: serializePromoCard(card) });
    } catch (error) {
      console.error("Update promo card error", error);
      res.status(400).json({ error: "Unable to update promo card" });
    }
  }
);

router.delete(
  "/vendors/promo-cards/:id",
  authMiddleware,
  loadVendor,
  requireApprovedVendor,
  async (req, res) => {
    await connectDB();
    const card = await PromoCard.findOne({ _id: req.params.id, vendorId: req.vendorDoc!._id }).exec();
    if (!card) {
      return res.status(404).json({ error: "Promo card not found" });
    }
    if (card.status !== "PENDING") {
      return res.status(400).json({ error: "Only pending promo cards can be deleted" });
    }
    await card.deleteOne();
    res.json({ success: true });
  }
);

router.get(
  "/vendors/promo-cards",
  authMiddleware,
  loadVendor,
  requireApprovedVendor,
  async (req, res) => {
    await connectDB();
    const cards = await PromoCard.find({ vendorId: req.vendorDoc!._id }).sort({ createdAt: -1 }).lean();
    res.json({ promoCards: cards.map(serializePromoCard) });
  }
);

router.get("/promo-cards", async (_req, res) => {
  await connectDB();
  const cards = await PromoCard.find({ status: "ACTIVE" }).sort({ createdAt: -1 }).limit(5).lean();
  res.json({ promoCards: cards.map(serializePromoCard) });
});

router.get(
  "/admin/promo-cards",
  authMiddleware,
  requireRole("admin"),
  async (_req, res) => {
    await connectDB();
    const cards = await PromoCard.find().sort({ createdAt: -1 }).populate("vendorId", "name").lean();
    res.json({
      promoCards: cards.map((card) => ({
        ...serializePromoCard(card as IPromoCard),
        vendor: (card.vendorId as any)?.name || null,
        status: card.status,
      })),
    });
  }
);

router.get(
  "/admin/users",
  authMiddleware,
  requireRole("admin"),
  async (_req, res) => {
    await connectDB();
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json({
      users: users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        roles: user.roles,
        coinsBalance: user.coinsBalance,
        pointsBalance: user.pointsBalance,
      })),
    });
  }
);

router.patch(
  "/admin/users/:id/roles",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({ roles: z.array(z.string().min(1)).min(1) });
    try {
      const payload = schema.parse(req.body);
      await connectDB();
      const user = await User.findById(req.params.id).exec();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      user.roles = payload.roles;
      await user.save();
      res.json({ user: { id: user._id.toString(), roles: user.roles } });
    } catch (error) {
      console.error("Role update error", error);
      res.status(400).json({ error: "Unable to update roles" });
    }
  }
);

router.get(
  "/admin/settings",
  authMiddleware,
  requireRole("admin"),
  async (_req, res) => {
    await connectDB();
    const settings = await getPlatformSettings();
    res.json({
      settings: {
        feeMysteryBox: settings.feeMysteryBox,
        feeChallenge: settings.feeChallenge,
        feePromoCard: settings.feePromoCard,
      },
    });
  }
);

router.patch(
  "/admin/settings/fees",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({
      feeMysteryBox: z.number().nonnegative().optional(),
      feeChallenge: z.number().nonnegative().optional(),
      feePromoCard: z.number().nonnegative().optional(),
    });
    try {
      const payload = schema.parse(req.body);
      await connectDB();
      const doc = await updatePlatformSettings(payload);
      res.json({
        settings: {
          feeMysteryBox: doc.feeMysteryBox,
          feeChallenge: doc.feeChallenge,
          feePromoCard: doc.feePromoCard,
        },
      });
    } catch (error) {
      console.error("Update settings error", error);
      res.status(400).json({ error: "Unable to update settings" });
    }
  }
);

router.get(
  "/admin/winners",
  authMiddleware,
  requireRole("admin"),
  async (_req, res) => {
    await connectDB();
    const winners = await WinnerSpotlight.find().sort({ createdAt: -1 }).lean();
    res.json({
      winners: winners.map((entry) => ({
        id: entry._id.toString(),
        winnerType: entry.winnerType,
        winnerName: entry.winnerName,
        headline: entry.headline,
        description: entry.description,
        status: entry.status,
      })),
    });
  }
);

const winnerSchema = z.object({
  winnerType: z.enum(["CHALLENGE", "MYSTERY_BOX"]),
  winnerName: z.string().min(2),
  headline: z.string().min(4),
  description: z.string().max(400).optional(),
});

router.post(
  "/admin/winners",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const payload = winnerSchema.parse(req.body);
      await connectDB();
      const entry = await WinnerSpotlight.create({
        winnerType: payload.winnerType,
        winnerName: payload.winnerName,
        headline: payload.headline,
        description: payload.description,
        status: "PUBLISHED",
      });
      res.json({ winner: entry });
    } catch (error) {
      console.error("Create winner error", error);
      res.status(400).json({ error: "Unable to create winner spotlight" });
    }
  }
);

router.patch(
  "/admin/winners/:id",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const payload = winnerSchema.extend({ status: z.enum(["PENDING", "PUBLISHED"]).optional() }).partial().parse(req.body);
      await connectDB();
      const winner = await WinnerSpotlight.findByIdAndUpdate(req.params.id, payload, { new: true }).lean();
      if (!winner) {
        return res.status(404).json({ error: "Winner entry not found" });
      }
      res.json({ winner });
    } catch (error) {
      console.error("Update winner error", error);
      res.status(400).json({ error: "Unable to update winner" });
    }
  }
);

router.delete(
  "/admin/winners/:id",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    await connectDB();
    await WinnerSpotlight.findByIdAndDelete(req.params.id).exec();
    res.json({ success: true });
  }
);

router.patch(
  "/admin/promo-cards/:id/status",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({ status: z.enum(["PENDING", "ACTIVE", "REJECTED"]) });
    try {
      const payload = schema.parse(req.body);
      await connectDB();
      const card = await PromoCard.findById(req.params.id).exec();
      if (!card) {
        return res.status(404).json({ error: "Promo card not found" });
      }
      card.status = payload.status;
      await card.save();
      res.json({ promoCard: serializePromoCard(card) });
    } catch (error) {
      console.error("Promo card status error", error);
      res.status(400).json({ error: "Unable to update promo card" });
    }
  }
);

router.delete(
  "/admin/promo-cards/:id",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    await connectDB();
    const card = await PromoCard.findById(req.params.id).exec();
    if (!card) {
      return res.status(404).json({ error: "Promo card not found" });
    }
    await card.deleteOne();
    res.json({ success: true });
  }
);

router.post("/pai/auth/check-email", async (req, res) => {
  const result = await forwardPaiRequest("/api/auth/check-email", req.body);
  if (!result.ok) {
    return res.status(result.status).json(result.data);
  }
  res.json(result.data);
});

router.post("/pai/auth/pre-signup", async (req, res) => {
  const result = await forwardPaiRequest("/api/auth/pre-signup", req.body);
  if (!result.ok) {
    return res.status(result.status).json(result.data);
  }
  res.json(result.data);
});

router.post("/pai/auth/pre-signup/verify", async (req, res) => {
  const result = await forwardPaiRequest("/api/auth/pre-signup/verify", req.body);
  if (!result.ok) {
    return res.status(result.status).json(result.data);
  }
  res.json(result.data);
});

router.delete("/profile", authMiddleware, async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await connectDB();
    await Promise.all([
      Vendor.deleteMany({ ownerUserId: req.userId }).exec(),
      Ledger.deleteMany({ userId: req.userId }).exec(),
      Purchase.deleteMany({ userId: req.userId }).exec(),
    ]);
    await User.findByIdAndDelete(req.userId).exec();
    res.json({ success: true });
  } catch (error) {
    console.error("Profile delete error", error);
    res.status(400).json({ error: "Unable to delete profile" });
  }
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

const challengeSchema = z.object({
  name: z.string().min(2),
  description: z.string().max(500).optional(),
  ticketPriceCoins: z.number().int().positive(),
  ticketCount: z.number().int().positive(),
});

router.post(
  "/vendors/products",
  authMiddleware,
  loadVendor,
  requireApprovedVendor,
  async (req, res) => {
    try {
      await connectDB();
      const type = typeof req.body?.type === "string" ? req.body.type : "MYSTERY_BOX";
      const settings = await getPlatformSettings();
      const submitter = req.userDoc!;
      if (type === "CHALLENGE") {
        const payload = challengeSchema.parse(req.body);
        await chargeSubmissionFee(submitter, settings.feeChallenge || 0, "CHALLENGE_SUBMISSION_FEE", {
          name: payload.name,
        });
        const product = new Product({
          vendorId: req.vendorDoc!._id,
          name: payload.name,
          description: payload.description,
          type: "CHALLENGE",
          status: "PENDING",
          ticketPriceCoins: payload.ticketPriceCoins,
          ticketCount: payload.ticketCount,
          ticketsSold: 0,
          priceCoins: payload.ticketPriceCoins,
        });
        await product.save();
        return res.json({ product });
      }
      const payload = mysteryBoxSchema.parse(req.body);
      const totalProbability = payload.rewardTiers.reduce((acc, tier) => acc + tier.probability, 0);
      if (Math.abs(totalProbability - 1) > 0.01) {
        return res.status(400).json({ error: "Reward probabilities must sum to 1" });
      }
      await chargeSubmissionFee(submitter, settings.feeMysteryBox || 0, "MYSTERY_BOX_SUBMISSION_FEE", {
        name: payload.name,
      });
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

router.patch(
  "/vendors/products/:id",
  authMiddleware,
  loadVendor,
  requireApprovedVendor,
  async (req, res) => {
    try {
      const payload = mysteryBoxSchema.parse(req.body);
      await connectDB();
      const product = await Product.findOne({ _id: req.params.id, vendorId: req.vendorDoc!._id }).exec();
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      if (product.status !== "PENDING") {
        return res.status(400).json({ error: "Only pending products can be edited" });
      }
      Object.assign(product, {
        name: payload.name,
        description: payload.description,
        priceCoins: payload.priceCoins,
        guaranteedMinPoints: payload.guaranteedMinPoints,
        rewardTiers: payload.rewardTiers,
      });
      await product.save();
      res.json({ product });
    } catch (error) {
      console.error("Update product error", error);
      res.status(400).json({ error: "Unable to update product" });
    }
  }
);

router.delete(
  "/vendors/products/:id",
  authMiddleware,
  loadVendor,
  requireApprovedVendor,
  async (req, res) => {
    await connectDB();
    const product = await Product.findOne({ _id: req.params.id, vendorId: req.vendorDoc!._id }).exec();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    if (product.status !== "PENDING") {
      return res.status(400).json({ error: "Only pending products can be deleted" });
    }
    await product.deleteOne();
    res.json({ success: true });
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
  "/admin/products/:id",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    try {
      const payload = mysteryBoxSchema.parse(req.body);
      await connectDB();
      const product = await Product.findById(req.params.id).exec();
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      Object.assign(product, {
        name: payload.name,
        description: payload.description,
        priceCoins: payload.priceCoins,
        guaranteedMinPoints: payload.guaranteedMinPoints,
        rewardTiers: payload.rewardTiers,
      });
      await product.save();
      res.json({ product });
    } catch (error) {
      console.error("Admin update product error", error);
      res.status(400).json({ error: "Unable to update product" });
    }
  }
);

router.delete(
  "/admin/products/:id",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    await connectDB();
    const product = await Product.findById(req.params.id).exec();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    await product.deleteOne();
    res.json({ success: true });
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

router.get("/challenges", async (_req, res) => {
  await connectDB();
  const challenges = await Product.find({ type: "CHALLENGE", status: "ACTIVE" })
    .populate("vendorId", "name")
    .lean();
  res.json({
    challenges: challenges.map((challenge) => ({
      id: challenge._id.toString(),
      name: challenge.name,
      description: challenge.description,
      ticketPriceCoins: challenge.ticketPriceCoins,
      ticketCount: challenge.ticketCount,
      ticketsSold: challenge.ticketsSold,
      vendor: challenge.vendorId,
      winnerUserId: challenge.challengeWinnerUserId,
    })),
  });
});

router.get("/winners", async (_req, res) => {
  await connectDB();
  const winners = await WinnerSpotlight.find({ status: "PUBLISHED" }).sort({ createdAt: -1 }).lean();
  res.json({
    winners: winners.map((entry) => ({
      id: entry._id.toString(),
      winnerType: entry.winnerType,
      winnerName: entry.winnerName,
      headline: entry.headline,
      description: entry.description,
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

router.post("/challenges/:id/buy", authMiddleware, async (req, res) => {
  const bodySchema = z.object({
    quantity: z.coerce.number().int().min(1).max(100).default(1),
  });
  try {
    const { quantity: requestedQuantity } = bodySchema.parse(req.body || {});
    await connectDB();
    const result = await withMongoSession(async (session) => {
      const productQuery = Product.findOne({ _id: req.params.id, type: "CHALLENGE", status: "ACTIVE" });
      if (session) productQuery.session(session);
      const product = await productQuery;
      if (!product || !product.ticketCount || !product.ticketPriceCoins) {
        return { error: "Challenge not found" } as const;
      }
      if (product.challengeWinnerUserId) {
        return { error: "Challenge already completed" } as const;
      }
      const remaining = product.ticketCount - (product.ticketsSold || 0);
      if (remaining <= 0) {
        return { error: "Challenge sold out" } as const;
      }
      const quantity = Math.min(requestedQuantity, remaining);
      if (quantity <= 0) {
        return { error: "No tickets remaining" } as const;
      }

      const userQuery = User.findById(req.userId);
      if (session) userQuery.session(session);
      const userDoc = await userQuery;
      if (!userDoc) {
        return { error: "User not found" } as const;
      }
      const totalCost = quantity * product.ticketPriceCoins;
      if (userDoc.coinsBalance < totalCost) {
        return { error: "Insufficient balance" } as const;
      }

      const vendorQuery = Vendor.findById(product.vendorId);
      if (session) vendorQuery.session(session);
      const vendorDoc = await vendorQuery;
      let vendorOwner: IUser | null = null;
      if (vendorDoc?.ownerUserId) {
        const ownerQuery = User.findById(vendorDoc.ownerUserId);
        if (session) ownerQuery.session(session);
        vendorOwner = await ownerQuery;
      }

      userDoc.coinsBalance -= totalCost;
      if (vendorOwner) {
        vendorOwner.coinsBalance += totalCost;
      }

      const startTicket = (product.ticketsSold || 0) + 1;
      const entries = Array.from({ length: quantity }).map((_, idx) => ({
        productId: product._id,
        userId: userDoc._id,
        ticketNumber: startTicket + idx,
      }));

      product.ticketsSold = (product.ticketsSold || 0) + quantity;

      if (session) {
        await userDoc.save({ session });
        if (vendorOwner) await vendorOwner.save({ session });
        await ChallengeEntry.insertMany(entries, { session });
        await product.save({ session });
      } else {
        await userDoc.save();
        if (vendorOwner) await vendorOwner.save();
        await ChallengeEntry.insertMany(entries);
        await product.save();
      }

      const ledgerEntries = [
        {
          userId: userDoc._id,
          deltaCoins: -totalCost,
          deltaPoints: 0,
          reason: "CHALLENGE_TICKET_PURCHASE",
          meta: { productId: product._id, quantity },
        },
      ];
      if (vendorOwner) {
        ledgerEntries.push({
          userId: vendorOwner._id,
          deltaCoins: totalCost,
          deltaPoints: 0,
          reason: "CHALLENGE_TICKET_REVENUE",
          meta: { productId: product._id, quantity },
        });
      }
      if (session) await Ledger.insertMany(ledgerEntries, { session });
      else await Ledger.insertMany(ledgerEntries);

      let winnerUserId: Types.ObjectId | null = null;
      if (product.ticketsSold >= (product.ticketCount || 0)) {
        const totalTickets = product.ticketCount || 0;
        const winningNumber = Math.floor(Math.random() * totalTickets) + 1;
        const winnerEntryQuery = ChallengeEntry.findOne({ productId: product._id, ticketNumber: winningNumber });
        if (session) winnerEntryQuery.session(session);
        const winnerEntry = await winnerEntryQuery;
        if (winnerEntry) {
          winnerUserId = winnerEntry.userId;
          product.challengeWinnerUserId = winnerEntry.userId;
          product.status = "INACTIVE";
          if (session) await product.save({ session });
          else await product.save();
        }
      }

      return {
        ticketsSold: product.ticketsSold,
        ticketCount: product.ticketCount,
        winnerUserId,
      } as const;
    });

    if ("error" in result) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      ticketsSold: result.ticketsSold,
      ticketCount: result.ticketCount,
      winnerUserId: result.winnerUserId,
    });
  } catch (error) {
    console.error("Buy challenge ticket error", error);
    res.status(400).json({ error: "Unable to process ticket purchase" });
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
  const update = req.body || {};
  const message = update.message || update.callback_query?.message;
  const text: string | undefined = update.message?.text || update.callback_query?.data;
  const isStartCommand = typeof text === "string" && text.startsWith("/start");

  if (isStartCommand && message?.chat?.id) {
    if (!env.TELEGRAM_BOT_TOKEN) {
      console.error("Missing TELEGRAM_BOT_TOKEN. Unable to respond to /start.");
    } else {
      const webAppUrl = env.WEBAPP_URL;
      const keyboard =
        webAppUrl && webAppUrl.startsWith("http")
          ? {
              keyboard: [
                [
                  {
                    text: "Open Waashop",
                    web_app: { url: webAppUrl },
                  },
                ],
              ],
              resize_keyboard: true,
            }
          : undefined;

      const welcomeText = webAppUrl
        ? "Welcome to Waashop!\nTap the button below to launch the Mini App and start shopping curated drops."
        : "Welcome to Waashop!\nVisit waashop.ai to open the Mini App and start shopping curated drops.";

      const initialState = {
        expand: true,
      };

      const apiUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      void fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: message.chat.id,
          text: welcomeText,
          reply_markup: keyboard,
          web_app: webAppUrl ? { initial_state: JSON.stringify(initialState) } : undefined,
        }),
      }).catch((error) => console.error("Telegram sendMessage error", error));
    }
  }

  res.json({ ok: true });
});

export default router;
