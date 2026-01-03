import { getSessionUser, getRecentLedger, getActiveBoxes } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { LedgerTable } from "@/components/LedgerTable";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
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

export default async function WalletPage({
  searchParams,
}: {
  searchParams?: { to?: string; amount?: string };
}) {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-black/20 bg-white p-6 text-sm text-gray-600">
        <p>Sign in to view your wallet history.</p>
        <p className="mt-2 text-xs text-gray-500">Use your email or username@pai.</p>
      </div>
    );
  }

  const [entries, boxes, transfers] = await Promise.all([
    getRecentLedger(50),
    getActiveBoxes(),
    backendFetch<{ outgoing: TransferDto[]; incoming: TransferDto[] }>("/api/transfers"),
  ]);

  const minis = (user as { minisBalance?: number }).minisBalance ?? 0;

  const prefillRecipient = typeof searchParams?.to === "string" ? searchParams.to : undefined;
  const prefillAmount = typeof searchParams?.amount === "string" ? searchParams.amount : undefined;
  const initialAction = prefillRecipient || prefillAmount ? "send" : null;

  return (
    <div className="space-y-6">
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
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Play drops</p>
            <p className="text-sm text-gray-600">This may change your life forever.</p>
          </div>
          <Link href="/shop" className="text-xs font-semibold text-black">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {boxes.slice(0, 2).map((box) => (
            <article key={box.boxId} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>PRICE PER BOX</span>
                <span className="rounded-full bg-black px-3 py-1 text-white">{formatMinis(box.priceMinis ?? 0)}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-black">{box.name}</h3>
              <div className="mt-3">
                <BoxPurchaseButton box={box} disabled={!user} />
              </div>
            </article>
          ))}
          {!boxes.length && (
            <div className="rounded-2xl border border-dashed border-black/20 bg-white p-4 text-center text-xs text-gray-500">
              No drops available right now.
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
