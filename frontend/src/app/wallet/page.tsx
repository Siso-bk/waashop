import { getSessionUser, getRecentLedger, getActiveBoxes } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { LedgerTable } from "@/components/LedgerTable";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import Link from "next/link";
import { formatMinis } from "@/lib/minis";
import { backendFetch } from "@/lib/backendClient";
import { revalidatePath } from "next/cache";

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

export default async function WalletPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-black/20 bg-white p-6 text-sm text-gray-600">
        Sign in to view your wallet history.
      </div>
    );
  }

  const [entries, boxes, transfers] = await Promise.all([
    getRecentLedger(50),
    getActiveBoxes(),
    backendFetch<{ outgoing: TransferDto[]; incoming: TransferDto[] }>("/api/transfers"),
  ]);

  const minis = (user as { minisBalance?: number }).minisBalance ?? 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Wallet</p>
        <h1 className="text-2xl font-semibold text-black">Balance</h1>
        <p className="text-sm text-gray-600">Buy, sell, deposit, and withdraw MINIS.</p>
      </header>
      <BalancePanel minis={minis} />
      <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-4">
          <a
            href="#send-minis"
            className="flex items-center justify-center rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
          >
            Send
          </a>
          <a
            href="#receive-minis"
            className="flex items-center justify-center rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
          >
            Receive
          </a>
          <a
            href="#deposit-minis"
            className="flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900"
          >
            Deposit
          </a>
          <a
            href="#withdraw-minis"
            className="flex items-center justify-center rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
          >
            Withdraw
          </a>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm" id="deposit-minis">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Buy minis</p>
          <h2 className="mt-2 text-lg font-semibold text-black">Deposit & top up</h2>
          <p className="mt-1 text-sm text-gray-600">
            Submit your receipt and we&apos;ll credit your balance. Status updates appear in notifications.
          </p>
          <form action={createDeposit} className="mt-4 space-y-3 text-sm text-gray-700">
            <input
              name="amountMinis"
              type="number"
              min={1}
              step={1}
              required
              placeholder="Amount (MINIS)"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <input
              name="currency"
              placeholder="Currency (USD, ETB, USDT...)"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <input
              name="paymentMethod"
              required
              placeholder="Payment method"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <input
              name="paymentReference"
              placeholder="Transaction reference"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <input
              name="proofUrl"
              placeholder="Proof link (optional)"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <textarea
              name="note"
              rows={3}
              placeholder="Notes to admin"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              Submit deposit
            </button>
          </form>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm" id="withdraw-minis">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Sell minis</p>
          <h2 className="mt-2 text-lg font-semibold text-black">Withdraw to cash</h2>
          <p className="mt-1 text-sm text-gray-600">
            Share payout details and the admin will review. You&apos;ll see updates in notifications.
          </p>
          <form action={createWithdrawal} className="mt-4 space-y-3 text-sm text-gray-700">
            <input
              name="amountMinis"
              type="number"
              min={1}
              step={1}
              required
              placeholder="Amount (MINIS)"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <input
              name="payoutMethod"
              required
              placeholder="Payout method"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <input
              name="payoutAddress"
              placeholder="Account / wallet address"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <input
              name="accountName"
              placeholder="Account name"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <textarea
              name="note"
              rows={3}
              placeholder="Notes to admin"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <button
              type="submit"
              className="w-full rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-100"
            >
              Submit withdrawal
            </button>
          </form>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm" id="send-minis">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Send minis</p>
          <h2 className="mt-2 text-lg font-semibold text-black">Transfer to another user</h2>
          <p className="mt-1 text-sm text-gray-600">
            Use email or username. Transfers above the admin limit require approval.
          </p>
          <form action={createTransfer} className="mt-4 space-y-3 text-sm text-gray-700">
            <input
              name="recipient"
              required
              placeholder="Recipient email or username"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <input
              name="amountMinis"
              type="number"
              min={1}
              step={1}
              required
              placeholder="Amount (MINIS)"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <textarea
              name="note"
              rows={2}
              placeholder="Note (optional)"
              className="w-full rounded-xl border border-black/10 px-3 py-2"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              Send transfer
            </button>
          </form>
          <div className="mt-4 space-y-2 text-xs text-gray-600">
            {transfers.outgoing.slice(0, 3).map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-2">
                <div>
                  <p className="text-gray-500">To {transfer.recipientHandle}</p>
                  <p className="font-semibold text-black">{formatMinis(transfer.amountMinis)}</p>
                </div>
                <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
                  {transfer.status}
                </span>
              </div>
            ))}
            {transfers.outgoing.length === 0 && <p>No outgoing transfers yet.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm" id="receive-minis">
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Receive minis</p>
          <h2 className="mt-2 text-lg font-semibold text-black">Share your wallet details</h2>
          <p className="mt-1 text-sm text-gray-600">
            Share your email or username to receive transfers.
          </p>
          <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-gray-50 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Your handle</p>
            <p className="mt-1 font-semibold text-black">
              {user.email || user.username || user.telegramId || "No handle yet"}
            </p>
          </div>
          <div className="mt-4 space-y-2 text-xs text-gray-600">
            {transfers.incoming.slice(0, 3).map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-2">
                <div>
                  <p className="text-gray-500">Incoming</p>
                  <p className="font-semibold text-black">{formatMinis(transfer.amountMinis)}</p>
                </div>
                <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
                  {transfer.status}
                </span>
              </div>
            ))}
            {transfers.incoming.length === 0 && <p>No incoming transfers yet.</p>}
          </div>
        </div>
      </section>
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

async function createDeposit(formData: FormData) {
  "use server";
  const amountMinisRaw = formData.get("amountMinis");
  const paymentMethod = formData.get("paymentMethod");
  if (!amountMinisRaw || !paymentMethod) {
    return;
  }
  const amountMinis = Number(amountMinisRaw);
  if (!Number.isFinite(amountMinis) || amountMinis <= 0) {
    return;
  }
  const payload = {
    amountMinis,
    currency: valueOrUndefined(formData.get("currency")),
    paymentMethod: String(paymentMethod),
    paymentReference: valueOrUndefined(formData.get("paymentReference")),
    proofUrl: valueOrUndefined(formData.get("proofUrl")),
    note: valueOrUndefined(formData.get("note")),
  };
  await backendFetch("/api/deposits", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  revalidatePath("/wallet");
}

async function createWithdrawal(formData: FormData) {
  "use server";
  const amountMinisRaw = formData.get("amountMinis");
  const payoutMethod = formData.get("payoutMethod");
  if (!amountMinisRaw || !payoutMethod) {
    return;
  }
  const amountMinis = Number(amountMinisRaw);
  if (!Number.isFinite(amountMinis) || amountMinis <= 0) {
    return;
  }
  const payload = {
    amountMinis,
    payoutMethod: String(payoutMethod),
    payoutAddress: valueOrUndefined(formData.get("payoutAddress")),
    accountName: valueOrUndefined(formData.get("accountName")),
    note: valueOrUndefined(formData.get("note")),
  };
  await backendFetch("/api/withdrawals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  revalidatePath("/wallet");
}

async function createTransfer(formData: FormData) {
  "use server";
  const recipient = formData.get("recipient");
  const amountMinisRaw = formData.get("amountMinis");
  if (!recipient || typeof recipient !== "string" || !amountMinisRaw) {
    return;
  }
  const amountMinis = Number(amountMinisRaw);
  if (!Number.isFinite(amountMinis) || amountMinis <= 0) {
    return;
  }
  const payload = {
    recipient: recipient.trim(),
    amountMinis,
    note: valueOrUndefined(formData.get("note")),
  };
  await backendFetch("/api/transfers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  revalidatePath("/wallet");
}

const valueOrUndefined = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
