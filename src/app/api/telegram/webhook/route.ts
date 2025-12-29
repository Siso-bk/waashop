import { NextResponse } from "next/server";
import { env } from "@/lib/env";

const sendTelegramMessage = async (
  chatId: number,
  text: string,
  replyMarkup?: Record<string, unknown>
) => {
  const apiUrl = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
      }),
    });
  } catch (error) {
    console.error("Failed to send Telegram message", error);
  }
};

export async function POST(request: Request) {
  const update = await request.json().catch(() => null);
  if (!update) {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (message?.text?.startsWith("/start")) {
    const webAppUrl = env.WEBAPP_URL;
    const replyMarkup = webAppUrl
      ? {
          keyboard: [
            [
              {
                text: "Open Mystery Wallet",
                web_app: { url: webAppUrl },
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        }
      : undefined;

    const welcomeText = [
      "Welcome to Mystery Wallet!",
      "Tap the button below to launch the Mini App and start opening boxes.",
    ].join("\n");

    await sendTelegramMessage(message.chat.id, welcomeText, replyMarkup);
  }

  return NextResponse.json({ ok: true });
}
