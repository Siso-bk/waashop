"use client";

import { useState } from "react";
import Link from "next/link";
import type { ChallengeWin, CustomerOrder } from "@/types";
import { formatMinis } from "@/lib/minis";

export function OrdersClient({
  initialOrders,
  initialChallengeWins = [],
}: {
  initialOrders: CustomerOrder[];
  initialChallengeWins?: ChallengeWin[];
}) {
  const [orders, setOrders] = useState<CustomerOrder[]>(initialOrders);
  const [challengeWins, setChallengeWins] = useState<ChallengeWin[]>(initialChallengeWins);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimDrafts, setClaimDrafts] = useState<Record<string, ClaimDraft>>({});

  const refreshOrders = async () => {
    const response = await fetch("/api/orders", { credentials: "include" });
    if (!response.ok) return;
    const data = await response.json().catch(() => ({}));
    if (data?.orders) {
      setOrders(data.orders);
    }
  };

  const refreshChallengeWins = async () => {
    const response = await fetch("/api/challenges/wins", { credentials: "include" });
    if (!response.ok) return;
    const data = await response.json().catch(() => ({}));
    if (data?.wins) {
      setChallengeWins(data.wins);
    }
  };

  const postAction = async (path: string, body?: Record<string, unknown>) => {
    setMessage(null);
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data?.error || "Unable to update order.");
      return;
    }
    await refreshOrders();
  };

  const confirmChallengePrize = async (challengeId: string) => {
    setMessage(null);
    setPendingChallengeId(challengeId);
    const response = await fetch(`/api/challenges/${challengeId}/confirm-prize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data?.error || "Unable to confirm prize.");
      setPendingChallengeId(null);
      return;
    }
    await refreshChallengeWins();
    setPendingChallengeId(null);
  };

  const submitClaim = async (challengeId: string) => {
    const draft = claimDrafts[challengeId];
    if (!draft?.recipientName || !draft.recipientPhone || !draft.recipientAddress) {
      setMessage("Add a name, phone, and address to claim your prize.");
      return;
    }
    setMessage(null);
    setClaimingId(challengeId);
    const response = await fetch(`/api/challenges/${challengeId}/claim-prize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        recipientName: draft.recipientName,
        recipientPhone: draft.recipientPhone,
        recipientAddress: draft.recipientAddress,
        note: draft.note || undefined,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data?.error || "Unable to submit delivery details.");
      setClaimingId(null);
      return;
    }
    await refreshChallengeWins();
    setClaimingId(null);
  };

  const updateDraft = (challengeId: string, patch: Partial<ClaimDraft>) => {
    setClaimDrafts((prev) => ({
      ...prev,
      [challengeId]: { ...prev[challengeId], ...patch },
    }));
  };

  return (
    <div className="space-y-4">
      {message && <p className="text-sm text-red-500">{message}</p>}
      {challengeWins.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Challenge wins</p>
            <h2 className="mt-1 text-base font-semibold text-black">Your prize queue</h2>
            <p className="text-xs text-gray-500">
              Confirm your prize so the admin can close the delivery loop.
            </p>
          </div>
          <div className="space-y-3">
            {challengeWins.map((win) => {
              const hasConfirmed = Boolean(win.prizeConfirmedAt);
              const hasDelivered = Boolean(win.prizeDeliveredAt);
              const hasClaimed = Boolean(win.prizeClaimedAt);
              const draft = claimDrafts[win.id] || {
                recipientName: win.prizeRecipientName || "",
                recipientPhone: win.prizeRecipientPhone || "",
                recipientAddress: win.prizeRecipientAddress || "",
                note: win.prizeClaimNote || "",
              };
              return (
                <div key={win.id} className="rounded-2xl border border-black/10 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-black">{win.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Ticket #{win.winnerTicketNumber ?? "—"} · {formatMinis(win.ticketPriceMinis)} each
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gray-500">
                      {hasConfirmed ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                          Confirmed
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                          Awaiting your confirmation
                        </span>
                      )}
                      {hasDelivered && (
                        <span className="rounded-full border border-black/10 bg-gray-100 px-2 py-1 font-semibold text-gray-600">
                          Delivered
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    {hasDelivered && !hasConfirmed && (
                      <span>Admin marked delivered. Please confirm to close the challenge.</span>
                    )}
                    {!hasDelivered && hasConfirmed && <span>Waiting on admin delivery confirmation.</span>}
                    {hasDelivered && hasConfirmed && <span>Prize delivered. Enjoy!</span>}
                    {!hasClaimed && <span>Submit delivery details to claim your prize.</span>}
                    {hasClaimed && !hasDelivered && <span>Delivery details submitted.</span>}
                  </div>
                  {!hasClaimed && (
                    <div className="mt-4 grid gap-2 text-xs text-gray-600">
                      <input
                        type="text"
                        value={draft.recipientName}
                        onChange={(event) => updateDraft(win.id, { recipientName: event.target.value })}
                        placeholder="Recipient name"
                        className="w-full rounded-xl border border-black/10 px-3 py-2"
                      />
                      <input
                        type="text"
                        value={draft.recipientPhone}
                        onChange={(event) => updateDraft(win.id, { recipientPhone: event.target.value })}
                        placeholder="Phone number"
                        className="w-full rounded-xl border border-black/10 px-3 py-2"
                      />
                      <textarea
                        rows={2}
                        value={draft.recipientAddress}
                        onChange={(event) => updateDraft(win.id, { recipientAddress: event.target.value })}
                        placeholder="Delivery address"
                        className="w-full rounded-xl border border-black/10 px-3 py-2"
                      />
                      <textarea
                        rows={2}
                        value={draft.note}
                        onChange={(event) => updateDraft(win.id, { note: event.target.value })}
                        placeholder="Delivery note (optional)"
                        className="w-full rounded-xl border border-black/10 px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => submitClaim(win.id)}
                        disabled={claimingId === win.id}
                        className="w-fit rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {claimingId === win.id ? "Submitting..." : "Submit delivery details"}
                      </button>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {!hasConfirmed && (
                      <button
                        type="button"
                        onClick={() => confirmChallengePrize(win.id)}
                        disabled={pendingChallengeId === win.id}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingChallengeId === win.id ? "Confirming..." : "Confirm prize"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {orders.map((order) => (
        <div key={order.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-black">Order {order.id.slice(-6)}</p>
              <p className="text-xs text-gray-500">Amount: {formatMinis(order.amountMinis)}</p>
            </div>
            <span className="rounded-full border border-black/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
              {order.status}
            </span>
          </div>
          {!order.escrowReleased &&
            !["COMPLETED", "REFUNDED", "CANCELLED"].includes(order.status) && (
              <div className="mt-2 text-xs text-gray-500">
                Held in escrow until delivery is confirmed.
              </div>
            )}
          <div className="mt-2 text-xs text-gray-500">
            <p>Shipping: {order.shippingAddress || "—"}</p>
            <p>Tracking: {order.trackingCode || "—"}</p>
          </div>
          <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 text-xs text-gray-600">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Order progress</p>
            <div className="mt-4 space-y-3">
              {(order.status === "COMPLETED"
                ? buildConfirmedEvents(order)
                : order.events && order.events.length > 0
                  ? order.events
                  : buildFallbackEvents(order)
              ).map(
                (event, index, list) => {
                  const isDelivered = event.status === "DELIVERED" || event.status === "COMPLETED";
                  const isSuccess = event.status === "DELIVERED";
                  const isLast = index === list.length - 1;
                  return (
                    <div key={`${order.id}-${event.status}-${index}`} className="flex items-start gap-3">
                      <div className="relative flex flex-col items-center">
                        <span
                          className={`mt-0.5 flex h-3 w-3 items-center justify-center rounded-full ${
                            isDelivered ? "bg-emerald-500" : "bg-[color:var(--app-text)]"
                          }`}
                        />
                        {!isLast && <span className="mt-1 h-7 w-px bg-[color:var(--surface-border)]" />}
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${isDelivered ? "text-black" : "text-black"}`}>
                          {formatStatus(event.status)}
                        </p>
                        {event.note && <p className="text-xs text-gray-500">{event.note}</p>}
                        <p className="text-[10px] text-gray-400">
                          {new Date(event.createdAt).toLocaleString()} · {event.actor}
                        </p>
                        {isSuccess && (
                          <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                            <span aria-hidden>✓</span>
                            Success delivery
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link
              href={`/chat?order=${order.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-1 font-semibold text-gray-600 hover:bg-gray-100"
            >
              <span aria-hidden>💬</span>
              Chat
            </Link>
            {isActiveDisputeEligible(order.status) && (
              <button
                type="button"
                onClick={() => postAction(`/api/orders/${order.id}/dispute`, { reason: "Not received" })}
                className="rounded-full border border-red-200 bg-red-50 px-3 py-1 font-semibold text-red-700 hover:bg-red-100"
              >
                Dispute
              </button>
            )}
            {isConfirmEligible(order.status) && (
              <button
                type="button"
                onClick={() => postAction(`/api/orders/${order.id}/confirm`)}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Confirm delivery
              </button>
            )}
            {order.status === "PLACED" && (
              <button
                type="button"
                onClick={() => postAction(`/api/orders/${order.id}/cancel`)}
                className="rounded-full border border-black/10 px-3 py-1 font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ))}
      {orders.length === 0 && challengeWins.length === 0 && (
        <p className="text-sm text-gray-500">No orders yet.</p>
      )}
    </div>
  );
}

type ClaimDraft = {
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  note?: string;
};

const STATUS_LABELS: Record<CustomerOrder["status"], string> = {
  PLACED: "Order placed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  DAMAGED: "Damaged",
  UNSUCCESSFUL: "Unsuccessful",
};

const formatStatus = (status: CustomerOrder["status"]) => STATUS_LABELS[status] ?? status;

const isActiveDisputeEligible = (status: CustomerOrder["status"]) =>
  ["PLACED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status);

const isConfirmEligible = (status: CustomerOrder["status"]) =>
  ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status);

const buildFallbackEvents = (order: CustomerOrder) => {
  const events: Array<{
    status: CustomerOrder["status"];
    note?: string;
    actor: "system";
    createdAt: string;
  }> = [];
  const placedAt = order.placedAt ?? order.createdAt ?? new Date().toISOString();
  events.push({ status: "PLACED", actor: "system", createdAt: placedAt });
  if (order.shippedAt) {
    events.push({ status: "SHIPPED", actor: "system", createdAt: order.shippedAt });
  }
  if (order.deliveredAt) {
    events.push({ status: "DELIVERED", actor: "system", createdAt: order.deliveredAt });
  }
  if (!events.some((event) => event.status === order.status)) {
    events.push({ status: order.status, actor: "system", createdAt: order.updatedAt ?? placedAt });
  }
  return events;
};

const buildConfirmedEvents = (order: CustomerOrder) => {
  const confirmedAt =
    order.events?.find((event) => event.status === "COMPLETED")?.createdAt ??
    order.completedAt ??
    order.updatedAt ??
    order.placedAt ??
    new Date().toISOString();
  return [
    {
      status: "COMPLETED" as const,
      note: "Delivery confirmed",
      actor: "buyer" as const,
      createdAt: confirmedAt,
    },
  ];
};
