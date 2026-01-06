"use client";

import { useEffect, useRef, useState } from "react";
import type { NotificationItem } from "@/types";

type Props = {
  initialNotifications: NotificationItem[];
};

export function NotificationsClient({ initialNotifications }: Props) {
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
  const markInFlightRef = useRef(false);
  const unreadCount = items.filter((item) => item.status === "UNREAD").length;

  useEffect(() => {
    setItems(initialNotifications);
  }, [initialNotifications]);

  useEffect(() => {
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
  }, [unreadCount]);

  return (
    <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400">Unread</p>
        <span className="rounded-full border border-black/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      </div>
      {items.map((item) => (
        <article
          key={item.id}
          className={`notification-surface rounded-2xl border p-4 transition ${
            item.status === "UNREAD" ? "notification-unread" : ""
          }`}
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-500">
            <span>{item.title}</span>
            <span className="text-[10px] tracking-[0.3em]">{new Date(item.createdAt).toLocaleString()}</span>
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
    </section>
  );
}
