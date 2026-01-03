"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { formatMinis } from "@/lib/minis";

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

type ActionType = "send" | "receive" | "deposit" | "withdraw" | null;

type WalletActionModalProps = {
  balanceMinis: number;
  userHandle: string;
  outgoingTransfers: TransferDto[];
  incomingTransfers: TransferDto[];
  createDeposit: (prevState: FormState, formData: FormData) => Promise<FormState>;
  createWithdrawal: (prevState: FormState, formData: FormData) => Promise<FormState>;
  createTransfer: (prevState: FormState, formData: FormData) => Promise<FormState>;
};

type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialFormState: FormState = { status: "idle" };

const actionLabels: Record<Exclude<ActionType, null>, { title: string; subtitle: string }> = {
  send: {
    title: "Send MINIS",
    subtitle: "Transfer to another user. Use their email or username@pai.",
  },
  receive: {
    title: "Receive MINIS",
    subtitle: "Share your handle to receive transfers.",
  },
  deposit: {
    title: "Deposit MINIS",
    subtitle: "Submit your payment proof and we’ll credit your wallet.",
  },
  withdraw: {
    title: "Withdraw MINIS",
    subtitle: "Request a payout and track approval status here.",
  },
};

export function WalletActionModal({
  balanceMinis,
  userHandle,
  outgoingTransfers,
  incomingTransfers,
  createDeposit,
  createWithdrawal,
  createTransfer,
}: WalletActionModalProps) {
  const [active, setActive] = useState<ActionType>(null);
  const [showOutgoing, setShowOutgoing] = useState(false);
  const [showIncoming, setShowIncoming] = useState(false);
  const [depositState, depositAction] = useFormState(createDeposit, initialFormState);
  const [withdrawState, withdrawAction] = useFormState(createWithdrawal, initialFormState);
  const [transferState, transferAction] = useFormState(createTransfer, initialFormState);
  const actionList = useMemo(
    () => [
      { key: "send", label: "Send" },
      { key: "receive", label: "Receive" },
      { key: "deposit", label: "Deposit" },
      { key: "withdraw", label: "Withdraw" },
    ],
    []
  );

  useEffect(() => {
    if (active) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
    return undefined;
  }, [active]);

  useEffect(() => {
    if (active === "deposit" && depositState.status === "success") {
      const timeout = setTimeout(() => setActive(null), 900);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [active, depositState.status]);

  useEffect(() => {
    if (active === "withdraw" && withdrawState.status === "success") {
      const timeout = setTimeout(() => setActive(null), 900);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [active, withdrawState.status]);

  useEffect(() => {
    if (active === "send" && transferState.status === "success") {
      const timeout = setTimeout(() => setActive(null), 900);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [active, transferState.status]);

  return (
    <>
      <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {actionList.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => setActive(action.key as ActionType)}
              className={`flex min-w-[140px] items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                action.key === "deposit"
                  ? "bg-black text-white hover:bg-gray-900"
                  : "border border-black/15 text-black hover:bg-black hover:text-white"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </section>

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-black/10 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{actionLabels[active].title}</p>
                <h2 className="mt-2 text-lg font-semibold text-black">{actionLabels[active].subtitle}</h2>
                <p className="mt-1 text-xs text-gray-500">Balance: {formatMinis(balanceMinis)}</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black transition hover:bg-black hover:text-white"
              >
                ×
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 pb-8 pt-6">
            {active === "deposit" && (
              <form action={depositAction} className="space-y-4 text-sm text-gray-700">
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
                {depositState.status !== "idle" && (
                  <p
                    className={`text-xs ${
                      depositState.status === "success" ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {depositState.message}
                  </p>
                )}
              </form>
            )}

            {active === "withdraw" && (
              <form action={withdrawAction} className="space-y-4 text-sm text-gray-700">
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
                {withdrawState.status !== "idle" && (
                  <p
                    className={`text-xs ${
                      withdrawState.status === "success" ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {withdrawState.message}
                  </p>
                )}
              </form>
            )}

            {active === "send" && (
              <div className="space-y-6">
                <form action={transferAction} className="space-y-4 text-sm text-gray-700">
                  <input
                    name="recipient"
                    required
                    placeholder="Recipient email or username@pai"
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
                  {transferState.status !== "idle" && (
                    <p
                      className={`text-xs ${
                        transferState.status === "success" ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {transferState.message}
                    </p>
                  )}
                </form>
                <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Recent sends</p>
                    <button
                      type="button"
                      onClick={() => setShowOutgoing((prev) => !prev)}
                      className="rounded-full border border-black/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
                    >
                      {showOutgoing ? "Fold" : "Expand"}
                    </button>
                  </div>
                  <div className={`overflow-y-auto ${showOutgoing ? "max-h-[320px]" : "max-h-[180px]"}`}>
                    <div className="space-y-2 px-3 py-3 text-xs text-gray-600">
                      {outgoingTransfers.slice(0, showOutgoing ? 12 : 0).map((transfer) => (
                        <div
                          key={transfer.id}
                          className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-2"
                        >
                      <div>
                        <p className="text-gray-500">To {transfer.recipientHandle}</p>
                        <p className="font-semibold text-black">{formatMinis(transfer.amountMinis)}</p>
                      </div>
                      <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
                        {transfer.status}
                      </span>
                    </div>
                      ))}
                      {showOutgoing && outgoingTransfers.length === 0 && <p>No outgoing transfers yet.</p>}
                      {!showOutgoing && outgoingTransfers.length > 0 && <p>Expand to view transfers.</p>}
                      {!showOutgoing && outgoingTransfers.length === 0 && <p>No outgoing transfers yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {active === "receive" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-dashed border-black/15 bg-gray-50 px-4 py-4 text-sm">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Your handle</p>
                  <p className="mt-2 font-semibold text-black">{userHandle}</p>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Recent receives</p>
                    <button
                      type="button"
                      onClick={() => setShowIncoming((prev) => !prev)}
                      className="rounded-full border border-black/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
                    >
                      {showIncoming ? "Fold" : "Expand"}
                    </button>
                  </div>
                  <div className={`overflow-y-auto ${showIncoming ? "max-h-[320px]" : "max-h-[180px]"}`}>
                    <div className="space-y-2 px-3 py-3 text-xs text-gray-600">
                      {incomingTransfers.slice(0, showIncoming ? 12 : 0).map((transfer) => (
                        <div
                          key={transfer.id}
                          className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-2"
                        >
                      <div>
                        <p className="text-gray-500">Incoming</p>
                        <p className="font-semibold text-black">{formatMinis(transfer.amountMinis)}</p>
                      </div>
                      <span className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
                        {transfer.status}
                      </span>
                    </div>
                      ))}
                      {showIncoming && incomingTransfers.length === 0 && <p>No incoming transfers yet.</p>}
                      {!showIncoming && incomingTransfers.length > 0 && <p>Expand to view transfers.</p>}
                      {!showIncoming && incomingTransfers.length === 0 && <p>No incoming transfers yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
