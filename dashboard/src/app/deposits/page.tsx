import { Suspense } from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getUserDeposits } from "@/lib/queries";
import { backendFetch } from "@/lib/backendClient";
import { requireToken } from "@/lib/session";
import { PendingButton } from "@/components/PendingButton";

export const dynamic = "force-dynamic";

export default async function DepositsPage() {
  await requireToken();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Wallet"
        title="Add coins to Waashop"
        description="Submit your payment receipt and let the admin credit your coins. You’ll be notified once it’s reviewed."
        actions={
          <Link href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            Back to overview
          </Link>
        }
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Submit deposit request</h2>
        <p className="mt-1 text-sm text-slate-500">
          Send your payment to the usual account, then share the reference and a proof link below. The team will verify
          and credit your coins.
        </p>
        <form action={createDeposit} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            Amount (coins)
            <input
              name="amountCoins"
              type="number"
              min={1}
              step={1}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2 font-semibold"
            />
          </label>
          <label className="text-sm text-slate-600">
            Currency you paid
            <input
              name="currency"
              placeholder="USD, ETB, USDT..."
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2"
            />
          </label>
          <label className="text-sm text-slate-600">
            Payment method
            <input
              name="paymentMethod"
              placeholder="Bank transfer, M-Pesa, USDT..."
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2"
            />
          </label>
          <label className="text-sm text-slate-600">
            Transaction / reference ID
            <input
              name="paymentReference"
              placeholder="e.g. TX12345"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2"
            />
          </label>
          <label className="text-sm text-slate-600 md:col-span-2">
            Proof link (screenshot URL, Telegram file, etc.)
            <input
              name="proofUrl"
              placeholder="https://..."
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2"
            />
          </label>
          <label className="text-sm text-slate-600 md:col-span-2">
            Notes to admin
            <textarea
              name="note"
              rows={3}
              placeholder="Anything else we should know?"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2"
            />
          </label>
          <div className="md:col-span-2">
            <PendingButton className="w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 md:w-auto">
              Submit request
            </PendingButton>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Your deposit requests</h2>
        <Suspense fallback={<DepositTableSkeleton />}>
          <DepositTable />
        </Suspense>
      </section>
    </div>
  );
}

async function DepositTable() {
  const { deposits } = await getUserDeposits();
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Proof</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {deposits.map((entry) => (
            <tr key={entry.id} className="border-t border-slate-100">
              <td className="px-4 py-3 text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3 font-semibold text-slate-900">{entry.amountCoins.toLocaleString()} coins</td>
              <td className="px-4 py-3 text-xs text-slate-600">
                <p>{entry.paymentMethod}</p>
                {entry.paymentReference && <p className="text-slate-400">{entry.paymentReference}</p>}
                {entry.note && <p className="mt-1 text-slate-400">{entry.note}</p>}
              </td>
              <td className="px-4 py-3 text-xs text-indigo-600">
                {entry.proofUrl ? (
                  <a href={entry.proofUrl} target="_blank" rel="noreferrer" className="hover:underline">
                    View proof
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={entry.status} />
                {entry.adminNote && <p className="mt-1 text-xs text-slate-500">{entry.adminNote}</p>}
              </td>
            </tr>
          ))}
          {deposits.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                No deposit requests yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DepositTableSkeleton() {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Proof</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 4 }).map((_, idx) => (
            <tr key={idx} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-36 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-20 rounded bg-slate-100 animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function createDeposit(formData: FormData) {
  "use server";
  const amountCoinsRaw = formData.get("amountCoins");
  const paymentMethod = formData.get("paymentMethod");
  if (!amountCoinsRaw || !paymentMethod) {
    return;
  }
  const amountCoins = Number(amountCoinsRaw);
  if (!Number.isFinite(amountCoins) || amountCoins <= 0) {
    return;
  }
  const payload = {
    amountCoins,
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
  revalidatePath("/deposits");
}

const valueOrUndefined = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
