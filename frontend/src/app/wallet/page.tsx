import { getSessionUser, getRecentLedger, getActiveBoxes } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { LedgerTable } from "@/components/LedgerTable";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import Link from "next/link";
import { formatMinis } from "@/lib/minis";
import { backendFetch } from "@/lib/backendClient";
import { revalidatePath } from "next/cache";

export default async function WalletPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-black/20 bg-white p-6 text-sm text-gray-600">
        Sign in to view your wallet history.
      </div>
    );
  }

  const [entries, boxes] = await Promise.all([getRecentLedger(50), getActiveBoxes()]);

  const minis = (user as { minisBalance?: number }).minisBalance ?? 0;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Wallet</p>
        <h1 className="text-2xl font-semibold text-black">Balance</h1>
        <p className="text-sm text-gray-600">Buy, sell, deposit, and withdraw MINIS.</p>
      </header>
      <BalancePanel minis={minis} />
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
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
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
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

const valueOrUndefined = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
