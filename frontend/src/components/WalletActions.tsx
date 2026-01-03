"use client";

import { useState } from "react";
import { formatMinis } from "@/lib/minis";

type FormState = {
  loading: boolean;
  error?: string;
  success?: string;
};

const initialState: FormState = { loading: false };

export function WalletActions({ balanceMinis }: { balanceMinis: number }) {
  const [depositState, setDepositState] = useState<FormState>(initialState);
  const [withdrawState, setWithdrawState] = useState<FormState>(initialState);

  const submitDeposit = async (form: HTMLFormElement) => {
    const formData = new FormData(form);
    setDepositState({ loading: true });
    try {
      const payload = {
        amountMinis: Number(formData.get("amountMinis")),
        currency: valueOrUndefined(formData.get("currency")),
        paymentMethod: String(formData.get("paymentMethod") || ""),
        paymentReference: valueOrUndefined(formData.get("paymentReference")),
        proofUrl: valueOrUndefined(formData.get("proofUrl")),
        note: valueOrUndefined(formData.get("note")),
      };
      const response = await fetch("/api/deposits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to submit deposit");
      }
      form.reset();
      setDepositState({ loading: false, success: "Deposit submitted. We'll notify you once it's reviewed." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit deposit";
      setDepositState({ loading: false, error: message });
    }
  };

  const submitWithdrawal = async (form: HTMLFormElement) => {
    const formData = new FormData(form);
    setWithdrawState({ loading: true });
    try {
      const payload = {
        amountMinis: Number(formData.get("amountMinis")),
        payoutMethod: String(formData.get("payoutMethod") || ""),
        payoutAddress: valueOrUndefined(formData.get("payoutAddress")),
        accountName: valueOrUndefined(formData.get("accountName")),
        note: valueOrUndefined(formData.get("note")),
      };
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to submit withdrawal");
      }
      form.reset();
      setWithdrawState({ loading: false, success: "Withdrawal request submitted for review." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit withdrawal";
      setWithdrawState({ loading: false, error: message });
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Buy minis</p>
            <h2 className="mt-2 text-lg font-semibold text-black">Deposit & top up</h2>
            <p className="mt-1 text-sm text-gray-600">
              Send payment and submit a receipt. Balance is {formatMinis(balanceMinis)}.
            </p>
          </div>
        </div>
        <form
          className="mt-4 space-y-3 text-sm text-gray-700"
          onSubmit={(event) => {
            event.preventDefault();
            if (!depositState.loading) {
              void submitDeposit(event.currentTarget);
            }
          }}
        >
          <input
            name="amountMinis"
            type="number"
            min={0.01}
            step={0.01}
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
            disabled={depositState.loading}
            className="w-full rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {depositState.loading ? "Submitting..." : "Submit deposit"}
          </button>
          {depositState.error && <p className="text-xs text-red-500">{depositState.error}</p>}
          {depositState.success && <p className="text-xs text-emerald-600">{depositState.success}</p>}
        </form>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Sell minis</p>
          <h2 className="mt-2 text-lg font-semibold text-black">Withdraw to cash</h2>
          <p className="mt-1 text-sm text-gray-600">
            Share payout details and we&apos;ll review the request.
          </p>
        </div>
        <form
          className="mt-4 space-y-3 text-sm text-gray-700"
          onSubmit={(event) => {
            event.preventDefault();
            if (!withdrawState.loading) {
              void submitWithdrawal(event.currentTarget);
            }
          }}
        >
          <input
            name="amountMinis"
            type="number"
            min={0.01}
            step={0.01}
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
            disabled={withdrawState.loading}
            className="w-full rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {withdrawState.loading ? "Submitting..." : "Submit withdrawal"}
          </button>
          {withdrawState.error && <p className="text-xs text-red-500">{withdrawState.error}</p>}
          {withdrawState.success && <p className="text-xs text-emerald-600">{withdrawState.success}</p>}
        </form>
      </div>
    </section>
  );
}

const valueOrUndefined = (value: FormDataEntryValue | null) => {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
