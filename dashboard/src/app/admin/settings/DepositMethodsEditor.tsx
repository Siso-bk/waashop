"use client";

import { useMemo, useState } from "react";

type DepositMethodEntry = {
  key?: string;
  currency: "USD" | "ETB";
  method: "BANK_TRANSFER" | "MOBILE_MONEY" | "WALLET_ADDRESS" | string;
  label?: string;
  accountName?: string;
  accountNumber?: string;
  phoneNumber?: string;
  walletAddress?: string;
  instructions?: string;
};

type DepositMethodsEditorProps = {
  initialEntries: DepositMethodEntry[];
};

const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank transfer",
  MOBILE_MONEY: "Mobile money",
  WALLET_ADDRESS: "Wallet address",
};

export function DepositMethodsEditor({ initialEntries }: DepositMethodsEditorProps) {
  const [entries, setEntries] = useState<DepositMethodEntry[]>(
    initialEntries.length ? initialEntries : []
  );

  const serialized = useMemo(() => JSON.stringify(entries), [entries]);

  const updateEntry = (index: number, patch: Partial<DepositMethodEntry>) => {
    setEntries((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, ...patch } : entry)));
  };

  const addEntry = () => {
    const nextKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `entry-${Date.now()}`;
    setEntries((prev) => [
      ...prev,
      { key: nextKey, currency: "USD", method: "BANK_TRANSFER", label: METHOD_LABELS.BANK_TRANSFER },
    ]);
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Deposit methods</p>
          <p className="mt-1 text-sm text-slate-500">
            Add USD/ETB payment instructions shown to users during deposit.
          </p>
        </div>
        <button
          type="button"
          onClick={addEntry}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300"
        >
          Add entry
        </button>
      </div>
      <input type="hidden" name="depositMethodEntries" value={serialized} />
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={entry.key || `${entry.currency}-${entry.method}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="grid w-full gap-3 md:grid-cols-2">
                <label className="block text-sm text-slate-600">
                  Currency
                  <select
                    value={entry.currency}
                    onChange={(event) => updateEntry(index, { currency: event.target.value as DepositMethodEntry["currency"] })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="USD">USD</option>
                    <option value="ETB">ETB</option>
                  </select>
                </label>
                <label className="block text-sm text-slate-600">
                  Method
                  <select
                    value={entry.method}
                    onChange={(event) => {
                      const nextMethod = event.target.value;
                      updateEntry(index, {
                        method: nextMethod,
                        label: entry.label || METHOD_LABELS[nextMethod],
                      });
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="MOBILE_MONEY">Mobile money</option>
                    <option value="WALLET_ADDRESS">Wallet address</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:border-red-300"
              >
                Remove
              </button>
            </div>
            <label className="mt-3 block text-sm text-slate-600">
              Label
              <input
                type="text"
                value={entry.label || ""}
                onChange={(event) => updateEntry(index, { label: event.target.value })}
                placeholder={METHOD_LABELS[entry.method] || "Label"}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate-600">
                Account name
                <input
                  type="text"
                  value={entry.accountName || ""}
                  onChange={(event) => updateEntry(index, { accountName: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm text-slate-600">
                Account number
                <input
                  type="text"
                  value={entry.accountNumber || ""}
                  onChange={(event) => updateEntry(index, { accountNumber: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <label className="block text-sm text-slate-600">
                Phone number
                <input
                  type="text"
                  value={entry.phoneNumber || ""}
                  onChange={(event) => updateEntry(index, { phoneNumber: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
              <label className="block text-sm text-slate-600">
                Wallet address
                <input
                  type="text"
                  value={entry.walletAddress || ""}
                  onChange={(event) => updateEntry(index, { walletAddress: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                />
              </label>
            </div>
            <label className="mt-3 block text-sm text-slate-600">
              Instructions
              <textarea
                rows={2}
                value={entry.instructions || ""}
                onChange={(event) => updateEntry(index, { instructions: event.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-slate-500">No deposit methods yet.</p>}
      </div>
    </section>
  );
}

type PayoutMethodEntry = {
  key?: string;
  currency: "USD" | "ETB";
  method: "BANK_TRANSFER" | "MOBILE_MONEY" | "WALLET_ADDRESS" | string;
  label?: string;
  instructions?: string;
};

type PayoutMethodsEditorProps = {
  initialEntries: PayoutMethodEntry[];
};

export function PayoutMethodsEditor({ initialEntries }: PayoutMethodsEditorProps) {
  const [entries, setEntries] = useState<PayoutMethodEntry[]>(
    initialEntries.length ? initialEntries : []
  );

  const serialized = useMemo(() => JSON.stringify(entries), [entries]);

  const updateEntry = (index: number, patch: Partial<PayoutMethodEntry>) => {
    setEntries((prev) => prev.map((entry, idx) => (idx === index ? { ...entry, ...patch } : entry)));
  };

  const addEntry = () => {
    const nextKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `entry-${Date.now()}`;
    setEntries((prev) => [
      ...prev,
      { key: nextKey, currency: "USD", method: "BANK_TRANSFER", label: METHOD_LABELS.BANK_TRANSFER },
    ]);
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Payout methods</p>
          <p className="mt-1 text-sm text-slate-500">
            Choose the withdrawal options shown to users by currency.
          </p>
        </div>
        <button
          type="button"
          onClick={addEntry}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-slate-300"
        >
          Add entry
        </button>
      </div>
      <input type="hidden" name="payoutMethodEntries" value={serialized} />
      <div className="space-y-4">
        {entries.map((entry, index) => (
          <div key={entry.key || `${entry.currency}-${entry.method}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="grid w-full gap-3 md:grid-cols-2">
                <label className="block text-sm text-slate-600">
                  Currency
                  <select
                    value={entry.currency}
                    onChange={(event) => updateEntry(index, { currency: event.target.value as PayoutMethodEntry["currency"] })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="USD">USD</option>
                    <option value="ETB">ETB</option>
                  </select>
                </label>
                <label className="block text-sm text-slate-600">
                  Method
                  <select
                    value={entry.method}
                    onChange={(event) => {
                      const nextMethod = event.target.value;
                      updateEntry(index, {
                        method: nextMethod,
                        label: entry.label || METHOD_LABELS[nextMethod],
                      });
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="BANK_TRANSFER">Bank transfer</option>
                    <option value="MOBILE_MONEY">Mobile money</option>
                    <option value="WALLET_ADDRESS">Wallet address</option>
                  </select>
                </label>
              </div>
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:border-red-300"
              >
                Remove
              </button>
            </div>
            <label className="mt-3 block text-sm text-slate-600">
              Label
              <input
                type="text"
                value={entry.label || ""}
                onChange={(event) => updateEntry(index, { label: event.target.value })}
                placeholder={METHOD_LABELS[entry.method] || "Label"}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="mt-3 block text-sm text-slate-600">
              Instructions (optional)
              <textarea
                rows={2}
                value={entry.instructions || ""}
                onChange={(event) => updateEntry(index, { instructions: event.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-slate-500">No payout methods yet.</p>}
      </div>
    </section>
  );
}
