import { NextResponse } from "next/server";
import { telegramAuthSchema } from "@/lib/validation";
import {
  createSessionToken,
  persistSession,
  upsertTelegramUser,
  verifyTelegramInitData,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { initData } = telegramAuthSchema.parse(payload);
    const profile = verifyTelegramInitData(initData);
    const { user } = await upsertTelegramUser(profile);
    const token = createSessionToken(user._id.toString());
    await persistSession(token);

    return NextResponse.json({
      user: {
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        coinsBalance: user.coinsBalance,
        pointsBalance: user.pointsBalance,
      },
    });
  } catch (error) {
    console.error("Auth error", error);
    return NextResponse.json({ error: "Invalid Telegram auth" }, { status: 400 });
  }
}
