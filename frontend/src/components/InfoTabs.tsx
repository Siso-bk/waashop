"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CustomerOrder, NotificationItem, UserProfile } from "@/types";
import { OrdersClient } from "@/components/OrdersClient";
import { readFavorites, type FavoriteProduct } from "@/lib/favorites";
import { formatMinis } from "@/lib/minis";

type InfoTabsProps = {
  user: UserProfile | null;
  initialOrders: CustomerOrder[];
  notifications: NotificationItem[];
};

export function InfoTabs({ user, initialOrders, notifications }: InfoTabsProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "notifications" | "favorites">("orders");
  const [items, setItems] = useState<NotificationItem[]>(notifications);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const markInFlightRef = useRef(false);
  const unreadCount = items.filter((item) => item.status === "UNREAD").length;

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  useEffect(() => {
    const refresh = () => setFavorites(readFavorites());
    refresh();
    window.addEventListener("favorites:updated", refresh);
    return () => window.removeEventListener("favorites:updated", refresh);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (activeTab !== "notifications") return;
    const hasUnread = unreadCount > 0;
    if (!hasUnread || markInFlightRef.current) return;
    markInFlightRef.current = true;
    const markRead = async () => {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        markInFlightRef.current = false;
        return;
      }
      const now = new Date().toISOString();
      setItems((prev) => prev.map((item) => ({ ...item, status: "READ", readAt: now })));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notifications:refresh"));
      }
      markInFlightRef.current = false;
    };
    void markRead();
  }, [activeTab, items, unreadCount, user]);

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
          {unreadCount > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("favorites")}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition ${
            activeTab === "favorites"
              ? "border-grey bg-black text-white"
              : "border-black/10 bg-white text-gray-500 hover:border-black/30"
          }`}
        >
          Favorites
          {favorites.length > 0 && (
            <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-semibold text-white">
              {favorites.length > 99 ? "99+" : favorites.length}
            </span>
          )}
        </button>
      </div>

      <section className="space-y-4">
        {activeTab === "orders" ? (
          user ? (
            <OrdersClient initialOrders={initialOrders} />
          ) : (
            signInCard
          )
        ) : activeTab === "notifications" ? (
          user ? (
            <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              {items.map((item, index) => (
                <article
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    item.status === "UNREAD"
                      ? "border-amber-200 bg-amber-50 text-black"
                      : "border-black/10 bg-white text-black"
                  } ${index === 0 ? "shadow-sm" : ""}`}
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-500">
                    <span>{item.title}</span>
                    <span className="text-[10px] tracking-[0.3em]">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-black/80 dark:text-white/80">{item.body}</p>
                  {item.status === "UNREAD" && (
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-600">
                      Unread
                    </p>
                  )}
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
          )
        ) : (
          <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            {favorites.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white p-4 transition hover:border-black/30"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Favorite</p>
                  <p className="mt-2 text-sm font-semibold text-black">{item.name}</p>
                  {item.vendorName && <p className="text-xs text-gray-500">{item.vendorName}</p>}
                </div>
                <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-black">
                  {formatMinis(item.priceMinis)}
                </span>
              </Link>
            ))}
            {favorites.length === 0 && (
              <div className="rounded-2xl border border-dashed border-black/10 p-4 text-center text-sm text-gray-500">
                No favorites yet. Tap the heart icon on a product to save it here.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
