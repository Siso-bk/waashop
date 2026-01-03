"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CustomerOrder, NotificationItem, UserProfile } from "@/types";
import { OrdersClient } from "@/components/OrdersClient";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type InfoTabsProps = {
  user: UserProfile | null;
  initialOrders: CustomerOrder[];
  notifications: NotificationItem[];
};

export function InfoTabs({ user, initialOrders, notifications }: InfoTabsProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "notifications">("orders");
  const [items, setItems] = useState<NotificationItem[]>(notifications);

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  useEffect(() => {
    if (!user || activeTab !== "notifications") return;
    const hasUnread = items.some((item) => item.status === "UNREAD");
    if (!hasUnread) return;
    const markRead = async () => {
      const response = await fetch(`${API_BASE_URL}/api/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) return;
      const now = new Date().toISOString();
      setItems((prev) => prev.map((item) => ({ ...item, status: "READ", readAt: now })));
    };
    void markRead();
  }, [activeTab, items, user]);

  const signInCard = (
    <div className="space-y-3 rounded-2xl border border-dashed border-black/20 bg-white p-6 text-center">
      <p className="text-sm text-gray-600">Sign in to view your Waashop updates.</p>
      <p className="text-xs text-gray-500">Use your email or username@pai.</p>
      <Link
        href="/login?redirect=/info"
        className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900"
      >
        Sign in
      </Link>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Info</p>
          <h1 className="text-2xl font-semibold text-black">Orders & alerts</h1>
          <p className="text-sm text-gray-600">Track orders, disputes, and system notifications.</p>
        </div>
        {user && (
          <div className="rounded-full border border-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-500">
            {user.username ? `${user.username}@pai` : user.email}
          </div>
        )}
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
            activeTab === "orders"
              ? "border-grey bg-black text-white"
              : "border-black/10 bg-white text-gray-500 hover:border-black/30"
          }`}
        >
          Orders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
            activeTab === "notifications"
              ? "border-grey bg-black text-white"
              : "border-black/10 bg-white text-gray-500 hover:border-black/30"
          }`}
        >
          Notifications
        </button>
      </div>

      <section className="space-y-4">
        {activeTab === "orders" ? (
          user ? (
            <OrdersClient initialOrders={initialOrders} />
          ) : (
            signInCard
          )
        ) : user ? (
          <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            {items.map((item, index) => (
              <article
                key={item.id}
                className={`rounded-2xl border border-black/10 p-4 ${
                  index === 0 ? "bg-black text-white" : "bg-white text-black"
                }`}
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-500">
                  <span>{item.title}</span>
                  <span className="text-[10px] tracking-[0.3em]">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-3 text-sm text-black/80 dark:text-white/80">{item.body}</p>
              </article>
            ))}
            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-black/10 p-4 text-center text-sm text-gray-500">
                Real-time notifications will appear here as Waashop events occur.
              </div>
            )}
          </div>
        ) : (
          signInCard
        )}
      </section>
    </div>
  );
}
