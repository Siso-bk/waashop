import { getSessionUser, getRecentLedger, getActiveJackpots } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { LedgerTable } from "@/components/LedgerTable";
import { JackpotPlayButton } from "@/components/JackpotPlayButton";
import Link from "next/link";
import { formatMinis } from "@/lib/minis";
import { backendFetch } from "@/lib/backendClient";
import { revalidatePath } from "next/cache";
import { WalletActionModal } from "@/components/WalletActionModal";

type TransferDto = {
  id: string;
  senderId: string;
  recipientId: string;
  recipientHandle: string;
  amountMinis: number;
  feeMinis: number;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  note?: string;
  adminNote?: string;
  createdAt: string;
};

type ActionResult = {
  status: "idle" | "success" | "error";
  message?: string;
};

type FxSettings = {
  minisPerUsd: number;
  usdToEtb: number;
};

export default async function WalletPage({
  searchParams,
}: {
  searchParams?: Promise<{ to?: string; amount?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="space-y-4 rounded-2xl border border-dashed border-black/20 bg-white p-6 text-sm text-gray-600">
        <div>
          <p>Sign in to view your wallet history.</p>
          <p className="mt-2 text-xs text-gray-500">Use your email or username@pai.</p>
        </div>
        <Link
          href="/login?redirect=/wallet"
          className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const [entries, jackpots, transfers, fxData] = await Promise.all([
    getRecentLedger(50),
    getActiveJackpots(),
    backendFetch<{ outgoing: TransferDto[]; incoming: TransferDto[] }>("/api/transfers"),
    backendFetch<{ settings: FxSettings }>("/api/settings/public", { auth: false }).catch(() => ({
      settings: { minisPerUsd: 100, usdToEtb: 120 },
    })),
  ]);

  const minis = (user as { minisBalance?: number }).minisBalance ?? 0;

  const resolvedParams = (await searchParams) ?? {};
  const prefillRecipient = typeof resolvedParams.to === "string" ? resolvedParams.to : undefined;
  const prefillAmount = typeof resolvedParams.amount === "string" ? resolvedParams.amount : undefined;
  const initialAction = prefillRecipient || prefillAmount ? "send" : null;

  return (
    <div className="wallet-theme space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Wallet</p>
        <h1 className="text-2xl font-semibold text-black">Balance</h1>
        <p className="text-sm text-gray-600">Buy, Sell, Deposit, Withdraw Minis.</p>
      </header>
      <BalancePanel minis={minis} />
      <WalletActionModal
        balanceMinis={minis}
        userHandle={user.username ? `${user.username}@pai` : user.email || user.telegramId || "No handle yet"}
        outgoingTransfers={transfers.outgoing}
        incomingTransfers={transfers.incoming}
        fxSettings={fxData.settings}
        initialRecipient={prefillRecipient}
        initialAmount={prefillAmount}
        initialAction={initialAction}
        createDeposit={createDeposit}
        createWithdrawal={createWithdrawal}
        createTransfer={createTransfer}
      />
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Jackpots</p>
            <p className="text-sm text-gray-600">Try your luck and watch the pool grow.</p>
          </div>
          <Link href="/shop?tab=jackpot-plays" className="text-xs font-semibold text-black">
            View all
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3">
          {jackpots.map((jackpot) => {
            const totalPercent = jackpot.platformPercent + jackpot.seedPercent + jackpot.vendorPercent;
            const winnerPrize = Math.max(0, Math.floor(jackpot.poolMinis * (1 - totalPercent / 100)));
            return (
              <article
                key={jackpot.id}
                className="min-w-[240px] rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>TRY PRICE</span>
                  <span className="rounded-full bg-black px-3 py-1 text-white">
                    {formatMinis(jackpot.priceMinis)}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-black">{jackpot.name}</h3>
                <p className="mt-1 text-xs font-semibold text-emerald-500">Winner prize {formatMinis(winnerPrize)}</p>
                <div className="mt-3">
                  <JackpotPlayButton jackpot={jackpot} signedIn={Boolean(user)} />
                </div>
              </article>
            );
          })}
          {!jackpots.length && (
            <div className="min-w-[240px] rounded-2xl border border-dashed border-black/20 bg-white p-4 text-center text-xs text-gray-500">
              No jackpots available right now.
            </div>
          )}
        </div>
      </section>
      <LedgerTable entries={entries} />
    </div>
  );
}

async function createDeposit(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  "use server";
  const amountMinisRaw = formData.get("amountMinis");
  const paymentMethod = formData.get("paymentMethod");
  if (!amountMinisRaw || !paymentMethod) {
    return { status: "error", message: "Amount and payment method are required." };
  }
  const amountMinis = roundToTwo(Number(amountMinisRaw));
  if (!Number.isFinite(amountMinis) || amountMinis < 0.01) {
    return { status: "error", message: "Enter a valid amount." };
  }
  const payload = {
    amountMinis,
    currency: valueOrUndefined(formData.get("currency")),
    paymentMethod: String(paymentMethod),
    paymentReference: valueOrUndefined(formData.get("paymentReference")),
    proofUrl: valueOrUndefined(formData.get("proofUrl")),
    note: valueOrUndefined(formData.get("note")),
  };
  try {
    await backendFetch("/api/deposits", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    revalidatePath("/wallet");
    return { status: "success", message: "Deposit submitted. We'll review it shortly." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit deposit.";
    return { status: "error", message };
  }
}

async function createWithdrawal(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  "use server";
  const amountMinisRaw = formData.get("amountMinis");
  const payoutMethod = formData.get("payoutMethod");
  if (!amountMinisRaw || !payoutMethod) {
    return { status: "error", message: "Amount and payout method are required." };
  }
  const amountMinis = roundToTwo(Number(amountMinisRaw));
  if (!Number.isFinite(amountMinis) || amountMinis < 0.01) {
    return { status: "error", message: "Enter a valid amount." };
  }
  const payload = {
    amountMinis,
    payoutMethod: String(payoutMethod),
    payoutAddress: valueOrUndefined(formData.get("payoutAddress")),
    accountName: valueOrUndefined(formData.get("accountName")),
    note: valueOrUndefined(formData.get("note")),
  };
  try {
    await backendFetch("/api/withdrawals", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    revalidatePath("/wallet");
    return { status: "success", message: "Withdrawal request submitted for review." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit withdrawal.";
    return { status: "error", message };
  }
}

async function createTransfer(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  "use server";
  const recipient = formData.get("recipient");
  const amountMinisRaw = formData.get("amountMinis");
  if (!recipient || typeof recipient !== "string" || !amountMinisRaw) {
    return { status: "error", message: "Recipient and amount are required." };
  }
  const amountMinis = roundToTwo(Number(amountMinisRaw));
  if (!Number.isFinite(amountMinis) || amountMinis < 0.01) {
    return { status: "error", message: "Enter a valid amount." };
  }
  const payload = {
    recipient: recipient.trim(),
    amountMinis,
    note: valueOrUndefined(formData.get("note")),
  };
  try {
    await backendFetch("/api/transfers", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    revalidatePath("/wallet");
    return { status: "success", message: "Transfer submitted." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send transfer.";
    return { status: "error", message };
  }
}

const valueOrUndefined = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const roundToTwo = (value: number) => Math.round(value * 100) / 100;
