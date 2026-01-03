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
import DepositRequest, { IDepositRequest } from "../models/DepositRequest";
import WithdrawalRequest, { IWithdrawalRequest } from "../models/WithdrawalRequest";
import TransferRequest, { ITransferRequest } from "../models/TransferRequest";
import Notification from "../models/Notification";
import { getPlatformSettings, updatePlatformSettings } from "../services/settings";
import { withMongoSession, connectDB } from "../lib/db";
import { resolveReward } from "../services/rewards";

const router = Router();

type HeroCard = {
  id: string;
  tagline?: string;
  title: string;
  body: string;
  imageUrl?: string;
  overlayOpacity?: number;
  ctaLabel?: string;
  ctaHref?: string;
  order?: number;
  status?: "DRAFT" | "PUBLISHED";
};

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
  cards: [] as HeroCard[],
};

type HeroResponse = typeof DEFAULT_HOME_HERO;

const serializeHero = (
  hero?: Partial<IHeroContent> | null,
  options: { includeDisabled?: boolean } = {}
): HeroResponse => {
  const cards = (hero?.cards ?? DEFAULT_HOME_HERO.cards)
    .map((card) => {
      const status = card.status ?? "PUBLISHED";
      return {
        id: card.id,
        tagline: card.tagline,
        title: card.title,
        body: card.body,
        imageUrl: card.imageUrl,
        overlayOpacity: card.overlayOpacity,
        ctaLabel: card.ctaLabel,
        ctaHref: card.ctaHref,
        order: card.order,
        status,
      };
    })
    .filter((card) => options.includeDisabled || card.status === "PUBLISHED")
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((card) => ({
      id: card.id,
      tagline: card.tagline,
      title: card.title,
      body: card.body,
      imageUrl: card.imageUrl,
      overlayOpacity: card.overlayOpacity,
      ctaLabel: card.ctaLabel,
      ctaHref: card.ctaHref,
      order: card.order,
      status: card.status,
    }));

  return {
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
    cards,
  };
};

const normalizeRewardTiers = (tiers?: any[]) =>
  (tiers || []).map((tier) => ({
    minis: tier.minis ?? 0,
    probability: tier.probability,
    isTop: tier.isTop,
  }));

const normalizeProduct = (product: any) => ({
  _id: product._id,
  vendorId: product.vendorId,
  name: product.name,
  description: product.description,
  type: product.type,
  status: product.status,
  priceMinis: product.priceMinis ?? 0,
  guaranteedMinMinis: product.guaranteedMinMinis ?? 0,
  rewardTiers: normalizeRewardTiers(product.rewardTiers),
  ticketPriceMinis: product.ticketPriceMinis ?? undefined,
  ticketCount: product.ticketCount,
  ticketsSold: product.ticketsSold,
  challengeWinnerUserId: product.challengeWinnerUserId,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
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

const sendTelegramNotification = async (telegramId: string | undefined | null, text: string) => {
  if (!telegramId || telegramId.startsWith("pai:") || !env.TELEGRAM_BOT_TOKEN) {
    return;
  }
  try {
    const apiUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: telegramId, text }),
    });
  } catch (error) {
    console.error("Telegram notification error", error);
  }
};

const createNotification = async (
  userId: string | Types.ObjectId | undefined,
  payload: { type: string; title: string; body?: string; meta?: Record<string, unknown> }
) => {
  if (!userId) return;
  try {
    await Notification.create({
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      meta: payload.meta,
      status: "UNREAD",
    });
  } catch (error) {
    console.error("Notification create error", error);
  }
};

const serializeDeposit = (deposit: IDepositRequest & { userId?: IUser | Types.ObjectId | string }) => {
  const userField = deposit.userId as IUser | Types.ObjectId | string | undefined;
  let userId: string | undefined;
  let userEmail: string | undefined;
  let username: string | undefined;
  let firstName: string | undefined;
  let lastName: string | undefined;

  if (userField) {
    if (typeof userField === "string") {
      userId = userField;
    } else if (userField instanceof Types.ObjectId) {
      userId = userField.toString();
    } else {
      userId = userField._id?.toString();
      userEmail = userField.email;
      username = userField.username;
      firstName = userField.firstName;
      lastName = userField.lastName;
    }
  }

  return {
    id: deposit._id.toString(),
    userId,
    userEmail,
    username,
    firstName,
    lastName,
    amountMinis: deposit.amountMinis,
    currency: deposit.currency,
    paymentMethod: deposit.paymentMethod,
    paymentReference: deposit.paymentReference,
    proofUrl: deposit.proofUrl,
    note: deposit.note,
    status: deposit.status,
    adminNote: deposit.adminNote,
    reviewedBy: deposit.reviewedBy ? deposit.reviewedBy.toString() : undefined,
    reviewedAt: deposit.reviewedAt?.toISOString(),
    minisCredited: deposit.minisCredited,
    createdAt: deposit.createdAt.toISOString(),
    updatedAt: deposit.updatedAt.toISOString(),
  };
};

const serializeWithdrawal = (
  withdrawal: IWithdrawalRequest & { userId?: IUser | Types.ObjectId | string }
) => {
  const userField = withdrawal.userId as IUser | Types.ObjectId | string | undefined;
  let userId: string | undefined;
  let userEmail: string | undefined;
  let username: string | undefined;
  let firstName: string | undefined;
  let lastName: string | undefined;
  if (userField) {
    if (typeof userField === "string") {
      userId = userField;
    } else if (userField instanceof Types.ObjectId) {
      userId = userField.toString();
    } else {
      userId = userField._id?.toString();
      userEmail = userField.email;
      username = userField.username;
      firstName = userField.firstName;
      lastName = userField.lastName;
    }
  }

  return {
    id: withdrawal._id.toString(),
    userId,
    userEmail,
    username,
    firstName,
    lastName,
    amountMinis: withdrawal.amountMinis,
    payoutMethod: withdrawal.payoutMethod,
    payoutAddress: withdrawal.payoutAddress,
    accountName: withdrawal.accountName,
    note: withdrawal.note,
    status: withdrawal.status,
    adminNote: withdrawal.adminNote,
    reviewedBy: withdrawal.reviewedBy ? withdrawal.reviewedBy.toString() : undefined,
    reviewedAt: withdrawal.reviewedAt?.toISOString(),
    createdAt: withdrawal.createdAt.toISOString(),
    updatedAt: withdrawal.updatedAt.toISOString(),
  };
};

const serializeTransfer = (transfer: ITransferRequest) => ({
  id: transfer._id.toString(),
  senderId: transfer.senderId.toString(),
  recipientId: transfer.recipientId.toString(),
  recipientHandle: transfer.recipientHandle,
  amountMinis: transfer.amountMinis,
  feeMinis: transfer.feeMinis,
  status: transfer.status,
  note: transfer.note,
  adminNote: transfer.adminNote,
  reviewedBy: transfer.reviewedBy ? transfer.reviewedBy.toString() : undefined,
  reviewedAt: transfer.reviewedAt?.toISOString(),
  createdAt: transfer.createdAt.toISOString(),
  updatedAt: transfer.updatedAt.toISOString(),
});

const serializeNotification = (notification: any) => ({
  id: notification._id.toString(),
  type: notification.type,
  title: notification.title,
  body: notification.body,
  meta: notification.meta || undefined,
  status: notification.status,
  createdAt: notification.createdAt?.toISOString?.() || new Date(notification.createdAt).toISOString(),
  readAt: notification.readAt ? notification.readAt.toISOString() : undefined,
});

const formatMinis = (value: number) => {
  const amount = Number.isFinite(value) ? value : 0;
  const unit = Math.abs(amount) === 1 ? "MINI" : "MINIS";
  return `${amount.toLocaleString()} ${unit}`;
};

const normalizeHandle = (raw: string) => {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.startsWith("@")) return trimmed.slice(1);
  if (trimmed.endsWith("@pai")) return trimmed.slice(0, -4);
  if (trimmed.endsWith(".pai")) return trimmed.slice(0, -4);
  return trimmed;
};

const ensureMinisBalance = (user: IUser) => {
  if (!Number.isFinite(user.minisBalance)) {
    user.minisBalance = 0;
  }
};

const chargeSubmissionFee = async (
  user: IUser,
  amount: number,
  reason: string,
  meta: Record<string, unknown>
) => {
  if (!amount || amount <= 0) return;
  ensureMinisBalance(user);
  if (user.minisBalance < amount) {
    throw new Error("Insufficient balance to pay submission fee");
  }
  user.minisBalance -= amount;
  await user.save();
  await Ledger.create({
    userId: user._id,
    deltaMinis: -amount,
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
    if (payload.username !== undefined) {
      const trimmed = payload.username.trim();
      if (!trimmed) {
        return res.status(400).json({ error: "Username cannot be empty" });
      }
      const normalized = normalizeHandle(trimmed);
      if (env.PAI_BASE_URL && req.headers.authorization) {
        const response = await fetch(`${env.PAI_BASE_URL}/api/profile`, {
          method: "PATCH",
          headers: {
            Authorization: req.headers.authorization,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ handle: normalized }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error || "Unable to update PAI handle");
        }
      }
      user.username = normalized;
    }
    if (payload.firstName !== undefined) user.firstName = payload.firstName;
    if (payload.lastName !== undefined) user.lastName = payload.lastName;
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
  res.json({ hero: serializeHero(hero, { includeDisabled: true }) });
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
    cards: z
      .array(
        z.object({
          id: z.string().min(1).max(100),
          tagline: z.string().max(120).optional(),
          title: z.string().min(1).max(120),
          body: z.string().min(1).max(400),
          imageUrl: z.string().max(400).optional(),
          overlayOpacity: z.number().min(0).max(0.95).optional(),
          ctaLabel: z.string().max(80).optional(),
          ctaHref: z.string().max(200).optional(),
          order: z.number().int().min(0).optional(),
          status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
          enabled: z.boolean().optional(),
        })
      )
      .default([]),
  });
  try {
    const payload = schema.parse(req.body);
    await connectDB();
    const hero = await HeroContent.findOneAndUpdate(
      { slug: "home" },
      { slug: "home", ...payload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ hero: serializeHero(hero, { includeDisabled: true }) });
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
        minisBalance: user.minisBalance,
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

router.post(
  "/admin/ledger/adjust",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z
      .object({
        userId: z.string().optional(),
        email: z.string().email().optional(),
        minisDelta: z.number().finite().optional().default(0),
        note: z.string().max(200).optional(),
      })
      .refine((data) => Boolean(data.userId || data.email), {
        message: "User identifier required",
        path: ["userId"],
      });

    try {
      const payload = schema.parse(req.body);
      const minisDelta = payload.minisDelta || 0;
      if (minisDelta === 0) {
        return res.status(400).json({ error: "Provide a minis delta" });
      }

      await connectDB();
      const userQuery = payload.userId
        ? User.findById(payload.userId)
        : User.findOne({ email: payload.email });
      const user = await userQuery;
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      ensureMinisBalance(user);
      const nextMinis = user.minisBalance + minisDelta;
      if (nextMinis < 0) {
        return res.status(400).json({ error: "Adjustment would result in negative balance" });
      }

      user.minisBalance = nextMinis;
      await user.save();

      await Ledger.create({
        userId: user._id,
        deltaMinis: minisDelta,
        reason: "ADMIN_MANUAL_ADJUSTMENT",
        meta: {
          adminUserId: req.userId,
          note: payload.note,
        },
      });

      res.json({
        userId: user._id.toString(),
        minisBalance: user.minisBalance,
      });
    } catch (error) {
      console.error("Ledger adjust error", error);
      res.status(400).json({ error: "Unable to adjust balance" });
    }
  }
);

router.get("/deposits", authMiddleware, async (req, res) => {
  await connectDB();
  const deposits = await DepositRequest.find({ userId: req.userId }).sort({ createdAt: -1 }).exec();
  res.json({ deposits: deposits.map((deposit) => serializeDeposit(deposit)) });
});

router.post("/deposits", authMiddleware, async (req, res) => {
  const schema = z.object({
    amountMinis: z.number().finite().min(1),
    currency: z.string().max(20).optional(),
    paymentMethod: z.string().min(1).max(100),
    paymentReference: z.string().max(120).optional(),
    proofUrl: z.string().max(500).optional(),
    note: z.string().max(500).optional(),
  });

  try {
    const payload = schema.parse(req.body);
    await connectDB();
    const deposit = await DepositRequest.create({
      userId: req.userId,
      amountMinis: payload.amountMinis,
      currency: payload.currency,
      paymentMethod: payload.paymentMethod,
      paymentReference: payload.paymentReference,
      proofUrl: payload.proofUrl,
      note: payload.note,
      status: "PENDING",
    });
    await createNotification(req.userId, {
      type: "DEPOSIT_SUBMITTED",
      title: `Deposit submitted: ${formatMinis(payload.amountMinis)}`,
      body: "We received your receipt and will review it shortly.",
      meta: { depositId: deposit._id, amountMinis: payload.amountMinis },
    });
    res.status(201).json({ deposit: serializeDeposit(deposit) });
  } catch (error) {
    console.error("Create deposit error", error);
    res.status(400).json({ error: "Unable to submit deposit" });
  }
});

router.get(
  "/admin/deposits",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const querySchema = z.object({
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    });
    try {
      const params = querySchema.parse(req.query);
      await connectDB();
      const filter: Record<string, unknown> = {};
      if (params.status) {
        filter.status = params.status;
      }
      const deposits = await DepositRequest.find(filter)
        .sort({ status: 1, createdAt: -1 })
        .populate("userId", "email username firstName lastName")
        .exec();
      res.json({ deposits: deposits.map((deposit) => serializeDeposit(deposit)) });
    } catch (error) {
      console.error("Admin deposits error", error);
      res.status(400).json({ error: "Unable to load deposits" });
    }
  }
);

router.post(
  "/admin/deposits/:id/approve",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({
      adminNote: z.string().max(500).optional(),
    });
    try {
      const payload = schema.parse(req.body || {});
      await connectDB();
      const result = await withMongoSession(async (session) => {
        const depositQuery = DepositRequest.findById(req.params.id);
        if (session) depositQuery.session(session);
        const deposit = await depositQuery;
        if (!deposit) {
          return { error: "Deposit not found" } as const;
        }
        if (deposit.status !== "PENDING") {
          return { error: "Deposit already processed" } as const;
        }
        const userQuery = User.findById(deposit.userId);
        if (session) userQuery.session(session);
        const user = await userQuery;
        if (!user) {
          return { error: "User not found" } as const;
        }
        ensureMinisBalance(user);
        const creditAmount = deposit.amountMinis;
        user.minisBalance += creditAmount;
        deposit.status = "APPROVED";
        deposit.adminNote = payload.adminNote;
        deposit.reviewedBy = req.userId ? new Types.ObjectId(req.userId) : undefined;
        deposit.reviewedAt = new Date();
        deposit.minisCredited = creditAmount;
        if (session) {
          await Promise.all([user.save({ session }), deposit.save({ session })]);
          await Ledger.create(
            [
              {
                userId: user._id,
                deltaMinis: creditAmount,
                reason: "DEPOSIT_CREDIT",
                meta: {
                  depositId: deposit._id,
                  paymentMethod: deposit.paymentMethod,
                  paymentReference: deposit.paymentReference,
                },
              },
            ],
            { session }
          );
        } else {
          await Promise.all([user.save(), deposit.save()]);
          await Ledger.create({
            userId: user._id,
            deltaMinis: creditAmount,
            reason: "DEPOSIT_CREDIT",
            meta: {
              depositId: deposit._id,
              paymentMethod: deposit.paymentMethod,
              paymentReference: deposit.paymentReference,
            },
          });
        }
        return { deposit, userTelegramId: user.telegramId };
      });

      if ("error" in result) {
        return res.status(400).json({ error: result.error });
      }

      const populated = await DepositRequest.findById(result.deposit._id)
        .populate("userId", "email username firstName lastName")
        .exec();
      const serialized = serializeDeposit(populated || result.deposit);
      const amountText = formatMinis(serialized.amountMinis);
      await createNotification(result.deposit.userId, {
        type: "DEPOSIT_APPROVED",
        title: `Deposit approved: ${amountText}`,
        body: "MINIS are now available in your Waashop wallet.",
        meta: { depositId: serialized.id, amountMinis: serialized.amountMinis },
      });
      await sendTelegramNotification(
        result.userTelegramId,
        `✅ Your Waashop deposit for ${amountText} has been approved.\nMINIS are now available in your wallet.`
      );
      res.json({ deposit: serialized });
    } catch (error) {
      console.error("Approve deposit error", error);
      res.status(400).json({ error: "Unable to approve deposit" });
    }
  }
);

router.post(
  "/admin/deposits/:id/reject",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({
      adminNote: z.string().max(500).optional(),
    });
    try {
      const payload = schema.parse(req.body || {});
      await connectDB();
      const deposit = await DepositRequest.findById(req.params.id).exec();
      if (!deposit) {
        return res.status(404).json({ error: "Deposit not found" });
      }
      if (deposit.status !== "PENDING") {
        return res.status(400).json({ error: "Deposit already processed" });
      }
      const user = await User.findById(deposit.userId).exec();
      deposit.status = "REJECTED";
      deposit.adminNote = payload.adminNote;
      deposit.reviewedBy = req.userId ? new Types.ObjectId(req.userId) : undefined;
      deposit.reviewedAt = new Date();
      await deposit.save();

      const populated = await DepositRequest.findById(deposit._id)
        .populate("userId", "email username firstName lastName")
        .exec();
      const serialized = serializeDeposit(populated || deposit);
      const amountText = formatMinis(serialized.amountMinis);
      await createNotification(deposit.userId, {
        type: "DEPOSIT_REJECTED",
        title: `Deposit rejected: ${amountText}`,
        body: payload.adminNote || "Please contact support for help completing your deposit.",
        meta: { depositId: serialized.id, amountMinis: serialized.amountMinis },
      });
      await sendTelegramNotification(
        user?.telegramId,
        `⚠️ Your Waashop deposit for ${amountText} was rejected.` +
          (payload.adminNote ? ` Reason: ${payload.adminNote}` : " Please contact support for assistance.")
      );
      res.json({ deposit: serialized });
    } catch (error) {
      console.error("Reject deposit error", error);
      res.status(400).json({ error: "Unable to reject deposit" });
    }
  }
);

router.get("/withdrawals", authMiddleware, async (req, res) => {
  await connectDB();
  const withdrawals = await WithdrawalRequest.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .exec();
  res.json({ withdrawals: withdrawals.map((withdrawal) => serializeWithdrawal(withdrawal)) });
});

router.post("/withdrawals", authMiddleware, async (req, res) => {
  const schema = z.object({
    amountMinis: z.number().finite().min(1),
    payoutMethod: z.string().min(1).max(100),
    payoutAddress: z.string().max(200).optional(),
    accountName: z.string().max(120).optional(),
    note: z.string().max(500).optional(),
  });

  try {
    const payload = schema.parse(req.body);
    await connectDB();
    const user = await User.findById(req.userId).exec();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    ensureMinisBalance(user);
    if (user.minisBalance < payload.amountMinis) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    user.minisBalance -= payload.amountMinis;
    const withdrawal = await WithdrawalRequest.create({
      userId: req.userId,
      amountMinis: payload.amountMinis,
      payoutMethod: payload.payoutMethod,
      payoutAddress: payload.payoutAddress,
      accountName: payload.accountName,
      note: payload.note,
      status: "PENDING",
    });
    await user.save();
    await Ledger.create({
      userId: user._id,
      deltaMinis: -payload.amountMinis,
      reason: "WITHDRAW_REQUEST",
      meta: { withdrawalId: withdrawal._id, payoutMethod: payload.payoutMethod },
    });

    await createNotification(req.userId, {
      type: "WITHDRAW_SUBMITTED",
      title: `Withdrawal requested: ${formatMinis(payload.amountMinis)}`,
      body: "We received your payout request and will review it shortly.",
      meta: { withdrawalId: withdrawal._id, amountMinis: payload.amountMinis },
    });

    res.status(201).json({ withdrawal: serializeWithdrawal(withdrawal) });
  } catch (error) {
    console.error("Create withdrawal error", error);
    res.status(400).json({ error: "Unable to submit withdrawal" });
  }
});

router.get(
  "/admin/withdrawals",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const querySchema = z.object({
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
    });
    try {
      const params = querySchema.parse(req.query);
      await connectDB();
      const filter = params.status ? { status: params.status } : {};
      const withdrawals = await WithdrawalRequest.find(filter)
        .sort({ createdAt: -1 })
        .populate("userId", "email username firstName lastName")
        .lean();
      res.json({
        withdrawals: withdrawals.map((withdrawal) =>
          serializeWithdrawal(withdrawal as IWithdrawalRequest)
        ),
      });
    } catch (error) {
      console.error("Admin withdrawals error", error);
      res.status(400).json({ error: "Unable to load withdrawals" });
    }
  }
);

router.post(
  "/admin/withdrawals/:id/approve",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({
      adminNote: z.string().max(200).optional(),
      payoutReference: z.string().max(120).optional(),
    });
    try {
      const payload = schema.parse(req.body);
      await connectDB();
      const withdrawal = await WithdrawalRequest.findById(req.params.id).exec();
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      if (withdrawal.status !== "PENDING") {
        return res.status(400).json({ error: "Withdrawal already processed" });
      }

      withdrawal.status = "APPROVED";
      withdrawal.adminNote = payload.adminNote;
      withdrawal.reviewedBy = req.userId ? new Types.ObjectId(req.userId) : undefined;
      withdrawal.reviewedAt = new Date();
      await withdrawal.save();

      const serialized = serializeWithdrawal(withdrawal);
      await createNotification(withdrawal.userId, {
        type: "WITHDRAW_APPROVED",
        title: `Withdrawal approved: ${formatMinis(serialized.amountMinis)}`,
        body: payload.adminNote || "Your withdrawal has been approved.",
        meta: { withdrawalId: serialized.id, amountMinis: serialized.amountMinis },
      });

      res.json({ withdrawal: serialized });
    } catch (error) {
      console.error("Approve withdrawal error", error);
      res.status(400).json({ error: "Unable to approve withdrawal" });
    }
  }
);

router.post(
  "/admin/withdrawals/:id/reject",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({
      adminNote: z.string().max(200).optional(),
    });
    try {
      const payload = schema.parse(req.body);
      await connectDB();
      const withdrawal = await WithdrawalRequest.findById(req.params.id).exec();
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }
      if (withdrawal.status !== "PENDING") {
        return res.status(400).json({ error: "Withdrawal already processed" });
      }

      const user = await User.findById(withdrawal.userId).exec();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      ensureMinisBalance(user);
      user.minisBalance += withdrawal.amountMinis;
      withdrawal.status = "REJECTED";
      withdrawal.adminNote = payload.adminNote;
      withdrawal.reviewedBy = req.userId ? new Types.ObjectId(req.userId) : undefined;
      withdrawal.reviewedAt = new Date();
      await Promise.all([user.save(), withdrawal.save()]);

      await Ledger.create({
        userId: user._id,
        deltaMinis: withdrawal.amountMinis,
        reason: "WITHDRAW_REVERSED",
        meta: { withdrawalId: withdrawal._id },
      });

      const serialized = serializeWithdrawal(withdrawal);
      await createNotification(withdrawal.userId, {
        type: "WITHDRAW_REJECTED",
        title: `Withdrawal rejected: ${formatMinis(serialized.amountMinis)}`,
        body: payload.adminNote || "Please contact support for help completing your withdrawal.",
        meta: { withdrawalId: serialized.id, amountMinis: serialized.amountMinis },
      });

      res.json({ withdrawal: serialized });
    } catch (error) {
      console.error("Reject withdrawal error", error);
      res.status(400).json({ error: "Unable to reject withdrawal" });
    }
  }
);

router.get("/transfers", authMiddleware, async (req, res) => {
  await connectDB();
  const [outgoing, incoming] = await Promise.all([
    TransferRequest.find({ senderId: req.userId }).sort({ createdAt: -1 }).limit(50).lean(),
    TransferRequest.find({ recipientId: req.userId }).sort({ createdAt: -1 }).limit(50).lean(),
  ]);
  res.json({
    outgoing: outgoing.map((transfer) => serializeTransfer(transfer as ITransferRequest)),
    incoming: incoming.map((transfer) => serializeTransfer(transfer as ITransferRequest)),
  });
});

router.post("/transfers", authMiddleware, async (req, res) => {
  const schema = z.object({
    recipient: z.string().min(2).max(120),
    amountMinis: z.number().finite().min(1),
    note: z.string().max(500).optional(),
  });

  try {
    const payload = schema.parse(req.body);
    await connectDB();
    const sender = await User.findById(req.userId).exec();
    if (!sender) {
      return res.status(404).json({ error: "User not found" });
    }
    ensureMinisBalance(sender);

    const rawRecipient = payload.recipient.trim();
    const normalizedHandle = normalizeHandle(rawRecipient);
    const recipient =
      (await User.findOne({ email: rawRecipient.toLowerCase() }).exec()) ||
      (await User.findOne({ username: normalizedHandle }).exec());
    if (!recipient) {
      return res.status(404).json({ error: "Recipient not found" });
    }
    if (recipient._id.equals(sender._id)) {
      return res.status(400).json({ error: "Cannot transfer to yourself" });
    }

    const settings = await getPlatformSettings();
    const feePercent = settings.transferFeePercent || 0;
    const feeMinis = Math.max(0, Math.round((payload.amountMinis * feePercent) / 100));
    const total = payload.amountMinis + feeMinis;
    if (sender.minisBalance < total) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    const autoApproveLimit = settings.transferLimitMinis || 0;
    const needsApproval = payload.amountMinis > autoApproveLimit;

    sender.minisBalance -= total;
    await sender.save();

    const displayHandle = rawRecipient.includes("@") || rawRecipient.includes(".")
      ? rawRecipient
      : `${normalizedHandle}@pai`;
    const transfer = await TransferRequest.create({
      senderId: sender._id,
      recipientId: recipient._id,
      recipientHandle: displayHandle,
      amountMinis: payload.amountMinis,
      feeMinis,
      status: needsApproval ? "PENDING" : "COMPLETED",
      note: payload.note,
    });

    await Ledger.create([
      {
        userId: sender._id,
        deltaMinis: -payload.amountMinis,
        reason: "TRANSFER_SEND",
        meta: { transferId: transfer._id, recipientId: recipient._id },
      },
      {
        userId: sender._id,
        deltaMinis: -feeMinis,
        reason: "TRANSFER_FEE",
        meta: { transferId: transfer._id },
      },
    ]);

    if (!needsApproval) {
      ensureMinisBalance(recipient);
      recipient.minisBalance += payload.amountMinis;
      await recipient.save();
      await Ledger.create({
        userId: recipient._id,
        deltaMinis: payload.amountMinis,
        reason: "TRANSFER_RECEIVE",
        meta: { transferId: transfer._id, senderId: sender._id },
      });
    }

    await createNotification(sender._id, {
      type: needsApproval ? "TRANSFER_PENDING" : "TRANSFER_COMPLETED",
      title: needsApproval
        ? `Transfer pending: ${formatMinis(payload.amountMinis)}`
        : `Transfer sent: ${formatMinis(payload.amountMinis)}`,
      body: needsApproval
        ? "Transfer awaits admin approval."
        : `Sent to ${recipient.email || recipient.username || "recipient"}.`,
      meta: { transferId: transfer._id, amountMinis: payload.amountMinis },
    });
    if (!needsApproval) {
      await createNotification(recipient._id, {
        type: "TRANSFER_RECEIVED",
        title: `Transfer received: ${formatMinis(payload.amountMinis)}`,
        body: `From ${sender.email || sender.username || "Waashop user"}.`,
        meta: { transferId: transfer._id, amountMinis: payload.amountMinis },
      });
    }

    res.status(201).json({ transfer: serializeTransfer(transfer) });
  } catch (error) {
    console.error("Create transfer error", error);
    res.status(400).json({ error: "Unable to create transfer" });
  }
});

router.get(
  "/admin/transfers",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const querySchema = z.object({
      status: z.enum(["PENDING", "COMPLETED", "REJECTED"]).optional(),
    });
    try {
      const params = querySchema.parse(req.query);
      await connectDB();
      const filter = params.status ? { status: params.status } : {};
      const transfers = await TransferRequest.find(filter)
        .sort({ createdAt: -1 })
        .populate("senderId", "email username firstName lastName")
        .populate("recipientId", "email username firstName lastName")
        .lean();
      res.json({
        transfers: transfers.map((transfer) => {
          const sender = (transfer as any).senderId;
          const recipient = (transfer as any).recipientId;
          return {
            ...serializeTransfer(transfer as ITransferRequest),
            senderEmail: sender?.email,
            senderUsername: sender?.username,
            senderName: [sender?.firstName, sender?.lastName].filter(Boolean).join(" ") || undefined,
            recipientEmail: recipient?.email,
            recipientUsername: recipient?.username,
            recipientName: [recipient?.firstName, recipient?.lastName].filter(Boolean).join(" ") || undefined,
          };
        }),
      });
    } catch (error) {
      console.error("Admin transfers error", error);
      res.status(400).json({ error: "Unable to load transfers" });
    }
  }
);

router.post(
  "/admin/transfers/:id/approve",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({
      adminNote: z.string().max(200).optional(),
    });
    try {
      const payload = schema.parse(req.body);
      await connectDB();
      const transfer = await TransferRequest.findById(req.params.id).exec();
      if (!transfer) {
        return res.status(404).json({ error: "Transfer not found" });
      }
      if (transfer.status !== "PENDING") {
        return res.status(400).json({ error: "Transfer already processed" });
      }

      const recipient = await User.findById(transfer.recipientId).exec();
      if (!recipient) {
        return res.status(404).json({ error: "Recipient not found" });
      }
      ensureMinisBalance(recipient);
      recipient.minisBalance += transfer.amountMinis;
      transfer.status = "COMPLETED";
      transfer.adminNote = payload.adminNote;
      transfer.reviewedBy = req.userId ? new Types.ObjectId(req.userId) : undefined;
      transfer.reviewedAt = new Date();
      await Promise.all([recipient.save(), transfer.save()]);

      await Ledger.create({
        userId: recipient._id,
        deltaMinis: transfer.amountMinis,
        reason: "TRANSFER_RECEIVE",
        meta: { transferId: transfer._id },
      });

      await createNotification(transfer.senderId, {
        type: "TRANSFER_APPROVED",
        title: `Transfer approved: ${formatMinis(transfer.amountMinis)}`,
        body: payload.adminNote || "Your transfer was approved.",
        meta: { transferId: transfer._id, amountMinis: transfer.amountMinis },
      });
      await createNotification(transfer.recipientId, {
        type: "TRANSFER_RECEIVED",
        title: `Transfer received: ${formatMinis(transfer.amountMinis)}`,
        body: "A transfer has been credited to your wallet.",
        meta: { transferId: transfer._id, amountMinis: transfer.amountMinis },
      });

      res.json({ transfer: serializeTransfer(transfer) });
    } catch (error) {
      console.error("Approve transfer error", error);
      res.status(400).json({ error: "Unable to approve transfer" });
    }
  }
);

router.post(
  "/admin/transfers/:id/reject",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const schema = z.object({
      adminNote: z.string().max(200).optional(),
    });
    try {
      const payload = schema.parse(req.body);
      await connectDB();
      const transfer = await TransferRequest.findById(req.params.id).exec();
      if (!transfer) {
        return res.status(404).json({ error: "Transfer not found" });
      }
      if (transfer.status !== "PENDING") {
        return res.status(400).json({ error: "Transfer already processed" });
      }

      const sender = await User.findById(transfer.senderId).exec();
      if (!sender) {
        return res.status(404).json({ error: "Sender not found" });
      }
      ensureMinisBalance(sender);
      sender.minisBalance += transfer.amountMinis + transfer.feeMinis;
      transfer.status = "REJECTED";
      transfer.adminNote = payload.adminNote;
      transfer.reviewedBy = req.userId ? new Types.ObjectId(req.userId) : undefined;
      transfer.reviewedAt = new Date();
      await Promise.all([sender.save(), transfer.save()]);

      await Ledger.create({
        userId: sender._id,
        deltaMinis: transfer.amountMinis + transfer.feeMinis,
        reason: "TRANSFER_REFUND",
        meta: { transferId: transfer._id },
      });

      await createNotification(transfer.senderId, {
        type: "TRANSFER_REJECTED",
        title: `Transfer rejected: ${formatMinis(transfer.amountMinis)}`,
        body: payload.adminNote || "Your transfer request was rejected.",
        meta: { transferId: transfer._id, amountMinis: transfer.amountMinis },
      });

      res.json({ transfer: serializeTransfer(transfer) });
    } catch (error) {
      console.error("Reject transfer error", error);
      res.status(400).json({ error: "Unable to reject transfer" });
    }
  }
);

router.get("/notifications", authMiddleware, async (req, res) => {
  await connectDB();
  const notifications = await Notification.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  res.json({ notifications: notifications.map(serializeNotification) });
});

router.get("/notifications/unread-count", authMiddleware, async (req, res) => {
  await connectDB();
  const count = await Notification.countDocuments({ userId: req.userId, status: "UNREAD" });
  res.json({ unread: count });
});

router.post("/notifications/read", authMiddleware, async (req, res) => {
  const schema = z.object({
    ids: z.array(z.string()).optional(),
  });
  try {
    const payload = schema.parse(req.body || {});
    await connectDB();
    const filter: Record<string, unknown> = { userId: req.userId, status: "UNREAD" };
    if (payload.ids?.length) {
      filter._id = { $in: payload.ids.map((id) => new Types.ObjectId(id)) };
    }
    const result = await Notification.updateMany(filter, { status: "READ", readAt: new Date() });
    res.json({ updated: result.modifiedCount });
  } catch (error) {
    console.error("Notifications read error", error);
    res.status(400).json({ error: "Unable to update notifications" });
  }
});

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
        feeTopWinnerPercent: settings.feeTopWinnerPercent,
        transferLimitMinis: settings.transferLimitMinis,
        transferFeePercent: settings.transferFeePercent,
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
      feeTopWinnerPercent: z.number().min(0).max(100).optional(),
      transferLimitMinis: z.number().nonnegative().optional(),
      transferFeePercent: z.number().min(0).max(100).optional(),
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
          feeTopWinnerPercent: doc.feeTopWinnerPercent,
          transferLimitMinis: doc.transferLimitMinis,
          transferFeePercent: doc.transferFeePercent,
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
  minis: z.number().int().positive(),
  probability: z.number().positive(),
  isTop: z.boolean().optional(),
});

const mysteryBoxSchema = z.object({
  name: z.string().min(2),
  description: z.string().max(500).optional(),
  priceMinis: z.number().int().positive(),
  guaranteedMinMinis: z.number().int().positive(),
  rewardTiers: z.array(rewardTierSchema).min(1),
});

const challengeSchema = z.object({
  name: z.string().min(2),
  description: z.string().max(500).optional(),
  ticketPriceMinis: z.number().int().positive(),
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
          ticketPriceMinis: payload.ticketPriceMinis,
          ticketCount: payload.ticketCount,
          ticketsSold: 0,
          priceMinis: payload.ticketPriceMinis,
        });
        await product.save();
        return res.json({ product: normalizeProduct(product) });
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
        priceMinis: payload.priceMinis,
        guaranteedMinMinis: payload.guaranteedMinMinis,
        rewardTiers: payload.rewardTiers,
        type: "MYSTERY_BOX",
        status: "PENDING",
      });
      await product.save();
      res.json({ product: normalizeProduct(product) });
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
        priceMinis: payload.priceMinis,
        guaranteedMinMinis: payload.guaranteedMinMinis,
        rewardTiers: payload.rewardTiers,
      });
      await product.save();
      res.json({ product: normalizeProduct(product) });
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
    res.json({ products: products.map((product) => normalizeProduct(product)) });
  }
);

router.get(
  "/admin/products",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    res.json({ products: products.map((product) => normalizeProduct(product)) });
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
        priceMinis: payload.priceMinis,
        guaranteedMinMinis: payload.guaranteedMinMinis,
        rewardTiers: payload.rewardTiers,
      });
      await product.save();
      res.json({ product: normalizeProduct(product) });
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
      priceMinis: (product as any).priceMinis ?? 0,
      guaranteedMinMinis: (product as any).guaranteedMinMinis ?? 0,
      rewardTiers: (product.rewardTiers || []).map((tier: any) => ({
        minis: tier.minis ?? 0,
        probability: tier.probability,
        isTop: tier.isTop,
      })),
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
      ticketPriceMinis: (challenge as any).ticketPriceMinis ?? 0,
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
    const settings = await getPlatformSettings();
    const topWinnerFeePercent = settings?.feeTopWinnerPercent ?? 0;

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
      ensureMinisBalance(userDoc);
      const priceMinis = (product as any).priceMinis ?? 0;
      if (!priceMinis) {
        return { error: "Mystery box price not configured" } as const;
      }
      if (userDoc.minisBalance < priceMinis) {
        return { error: "Insufficient balance" } as const;
      }

      const purchase = new Purchase({
        purchaseId,
        userId: userDoc._id,
        boxId,
        priceMinis,
        status: "PENDING",
      });
      if (session) await purchase.save({ session });
      else await purchase.save();

      userDoc.minisBalance -= priceMinis;
      const { rewardMinis: grossRewardMinis, awardedTop, tier } = resolveReward(product, userDoc);
      let platformFeeMinis = 0;
      if (awardedTop && topWinnerFeePercent > 0) {
        platformFeeMinis = Math.min(
          grossRewardMinis,
          Math.max(0, Math.round((grossRewardMinis * topWinnerFeePercent) / 100))
        );
      }
      const netRewardMinis = grossRewardMinis - platformFeeMinis;
      userDoc.minisBalance += grossRewardMinis;
      if (platformFeeMinis > 0) {
        userDoc.minisBalance -= platformFeeMinis;
      }
      if (awardedTop) {
        userDoc.lastTopWinAt = new Date();
      }

      const rewardMeta: Record<string, unknown> = {
        productId: product._id,
        purchaseId,
        tierMinis: tier.minis,
        awardedTop,
        netMinis: netRewardMinis,
        grossMinis: grossRewardMinis,
        platformFeeMinis,
        feePercent: topWinnerFeePercent,
      };

      const ledgerEntries = [
        {
          userId: userDoc._id,
          deltaMinis: -priceMinis,
          reason: "BOX_PURCHASE_DEBIT",
          meta: { productId: product._id, purchaseId },
        },
        {
          userId: userDoc._id,
          deltaMinis: grossRewardMinis,
          reason: "BOX_REWARD_CREDIT",
          meta: rewardMeta,
        },
      ];
      if (platformFeeMinis > 0) {
        ledgerEntries.push({
          userId: userDoc._id,
          deltaMinis: -platformFeeMinis,
          reason: "TOP_WINNER_FEE",
          meta: { ...rewardMeta, feeApplied: true },
        });
      }

      if (session) {
        await userDoc.save({ session });
        await Ledger.insertMany(ledgerEntries, { session });
      } else {
        await userDoc.save();
        await Ledger.insertMany(ledgerEntries);
      }

      purchase.rewardMinis = netRewardMinis;
      purchase.status = "COMPLETED";
      if (session) await purchase.save({ session });
      else await purchase.save();

      return {
        purchase,
        userDoc,
        netRewardMinis,
        grossRewardMinis,
        platformFeeMinis,
        tier,
      } as const;
    });

    if ("error" in result) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      purchaseId,
      rewardMinis: result.netRewardMinis,
      grossRewardMinis: result.grossRewardMinis,
      platformFeeMinis: result.platformFeeMinis,
      tier: result.tier,
      balances: {
        minis: result.userDoc.minisBalance,
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
      const ticketPriceMinis = (product as any).ticketPriceMinis ?? 0;
      if (!product || !product.ticketCount || !ticketPriceMinis) {
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
      ensureMinisBalance(userDoc);
      const totalCost = quantity * ticketPriceMinis;
      if (userDoc.minisBalance < totalCost) {
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
      if (vendorOwner) {
        ensureMinisBalance(vendorOwner);
      }

      userDoc.minisBalance -= totalCost;
      if (vendorOwner) {
        vendorOwner.minisBalance += totalCost;
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
          deltaMinis: -totalCost,
          reason: "CHALLENGE_TICKET_PURCHASE",
          meta: { productId: product._id, quantity },
        },
      ];
      if (vendorOwner) {
        ledgerEntries.push({
          userId: vendorOwner._id,
          deltaMinis: totalCost,
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
    items: items.map((entry: any) => ({
      id: entry._id?.toString?.() || entry.id,
      deltaMinis: entry.deltaMinis ?? 0,
      reason: entry.reason,
      meta: entry.meta || {},
      createdAt: entry.createdAt,
    })),
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
    { $setOnInsert: { minisBalance: 10000, roles: ["customer", "vendor", "admin"] } },
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
    { name: "Mystery MINI Box" },
    {
      vendorId: vendor._id,
      description: "Seeded product",
      priceMinis: 1000,
      guaranteedMinMinis: 600,
      rewardTiers: [
        { minis: 600, probability: 0.55 },
        { minis: 800, probability: 0.25 },
        { minis: 1000, probability: 0.15 },
        { minis: 3000, probability: 0.04 },
        { minis: 10000, probability: 0.01, isTop: true },
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
              inline_keyboard: [
                [
                  {
                    text: "Open Waashop",
                    web_app: { url: webAppUrl },
                  },
                ],
              ],
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
          web_app: webAppUrl ? { url: webAppUrl, initial_state: JSON.stringify(initialState) } : undefined,
        }),
      }).catch((error) => console.error("Telegram sendMessage error", error));
    }
  }

  res.json({ ok: true });
});

export default router;
