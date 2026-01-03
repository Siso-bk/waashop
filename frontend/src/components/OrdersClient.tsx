"use client";

import { useState } from "react";
import type { CustomerOrder } from "@/types";
import { formatMinis } from "@/lib/minis";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export function OrdersClient({ initialOrders }: { initialOrders: CustomerOrder[] }) {
  const [orders, setOrders] = useState<CustomerOrder[]>(initialOrders);
  const [message, setMessage] = useState<string | null>(null);

  const refreshOrders = async () => {
    const response = await fetch(`${API_BASE_URL}/api/orders`, { credentials: "include" });
    if (!response.ok) return;
    const data = await response.json().catch(() => ({}));
    if (data?.orders) {
      setOrders(data.orders);
    }
  };

  const postAction = async (path: string, body?: Record<string, unknown>) => {
    setMessage(null);
    const response = await fetch(`${API_BASE_URL}${path}`, {
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
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {(order.status === "PLACED" || order.status === "SHIPPED" || order.status === "DELIVERED") && (
              <button
                type="button"
                onClick={() => postAction(`/api/orders/${order.id}/dispute`, { reason: "Not received" })}
                className="rounded-full border border-red-200 bg-red-50 px-3 py-1 font-semibold text-red-700 hover:bg-red-100"
              >
                Dispute
              </button>
            )}
            {(order.status === "SHIPPED" || order.status === "DELIVERED") && (
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
