"use client";

import { useState } from "react";
import Link from "next/link";
import type { CustomerOrder } from "@/types";
import { formatMinis } from "@/lib/minis";

export function OrdersClient({ initialOrders }: { initialOrders: CustomerOrder[] }) {
  const [orders, setOrders] = useState<CustomerOrder[]>(initialOrders);
  const [message, setMessage] = useState<string | null>(null);

  const refreshOrders = async () => {
    const response = await fetch("/api/orders", { credentials: "include" });
    if (!response.ok) return;
    const data = await response.json().catch(() => ({}));
    if (data?.orders) {
      setOrders(data.orders);
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

  return (
    <div className="space-y-4">
      {message && <p className="text-sm text-red-500">{message}</p>}
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
          <div className="mt-2 text-xs text-gray-500">
            <p>Shipping: {order.shippingAddress || "—"}</p>
            <p>Tracking: {order.trackingCode || "—"}</p>
          </div>
          <div className="mt-4 rounded-2xl border border-black/10 bg-gray-50 p-4 text-xs text-gray-600">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Order progress</p>
            <div className="mt-4 space-y-3">
              {(order.events && order.events.length > 0 ? order.events : buildFallbackEvents(order)).map(
                (event, index, list) => {
                  const isDelivered = event.status === "DELIVERED" || event.status === "COMPLETED";
                  const isSuccess = event.status === "DELIVERED";
                  const isLast = index === list.length - 1;
                  return (
                    <div key={`${order.id}-${event.status}-${index}`} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`mt-0.5 flex h-3 w-3 items-center justify-center rounded-full ${
                            isDelivered ? "bg-emerald-500" : "bg-black/60"
                          }`}
                        />
                        {!isLast && <span className="mt-1 h-6 w-px bg-black/10" />}
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
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
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
      {orders.length === 0 && <p className="text-sm text-gray-500">No orders yet.</p>}
    </div>
  );
}

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
