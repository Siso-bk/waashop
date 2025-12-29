import crypto from "crypto";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { env, isProd } from "@/lib/env";
import { connectDB } from "@/lib/db";
import User, { IUser } from "@/models/User";

export const SESSION_COOKIE = "waashop-session";

export interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface SessionTokenPayload {
  userId: string;
}

export const verifyTelegramInitData = (initData: string): TelegramWebAppUser => {
  if (!initData) {
    throw new Error("Missing initData");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) {
    throw new Error("Missing Telegram hash signature");
  }

  const dataCheckArr: string[] = [];
  params.forEach((value, key) => {
    if (key === "hash") return;
    dataCheckArr.push(`${key}=${value}`);
  });
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(env.TELEGRAM_BOT_TOKEN)
    .digest();

  const computed = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  if (computed !== hash) {
    throw new Error("Invalid Telegram signature");
  }

  const authDateRaw = params.get("auth_date");
  if (!authDateRaw) {
    throw new Error("Missing auth_date");
  }
  const authDate = Number(authDateRaw);
  if (Number.isNaN(authDate)) {
    throw new Error("Invalid auth_date");
  }
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 60 * 60 * 24) {
    throw new Error("Telegram payload expired");
  }

  const userRaw = params.get("user");
  if (!userRaw) {
    throw new Error("Missing Telegram user data");
  }

  const parsedUser = JSON.parse(userRaw) as TelegramWebAppUser;
  if (!parsedUser.id) {
    throw new Error("Invalid Telegram user");
  }

  return parsedUser;
};

export const createSessionToken = (userId: string) =>
  jwt.sign({ userId } satisfies SessionTokenPayload, env.JWT_SECRET, { expiresIn: "7d" });

export const verifySessionToken = (token: string): SessionTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as SessionTokenPayload;
};

export const persistSession = async (token: string) => {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
};

export const getSessionUser = async (): Promise<IUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const payload = verifySessionToken(token);
    await connectDB();
    const user = await User.findById(payload.userId).exec();
    return user;
  } catch {
    return null;
  }
};

export const clearSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
};

export const upsertTelegramUser = async (profile: TelegramWebAppUser) => {
  await connectDB();
  const telegramId = profile.id.toString();
  let user = await User.findOne({ telegramId }).exec();
  let isNew = false;

  if (!user) {
    isNew = true;
    user = new User({
      telegramId,
      firstName: profile.first_name,
      lastName: profile.last_name,
      username: profile.username,
      coinsBalance: isProd ? 0 : 5000,
      pointsBalance: 0,
    });
  } else {
    user.firstName = profile.first_name || user.firstName;
    user.lastName = profile.last_name || user.lastName;
    user.username = profile.username || user.username;
  }

  await user.save();
  return { user, isNew };
};
