import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getNotifications, getNotificationsSummary } from "@/lib/queries";
import { backendFetch } from "@/lib/backendClient";
import { requireToken } from "@/lib/session";
import { PendingButton } from "@/components/PendingButton";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  await requireToken();
  return (
    <div className="space-y-6">
      <Suspense fallback={<HeaderSkeleton />}>
        <NotificationsHeader />
      </Suspense>
      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsList />
      </Suspense>
    </div>
  );
}

async function NotificationsHeader() {
  const summary = await getNotificationsSummary();
  return (
    <PageHeader
      eyebrow="Notifications"
      title="Inbox"
      description="System alerts, deposit updates, and platform announcements."
      actions={
        summary.unread > 0 && (
          <form action={markAllReadAction}>
            <PendingButton className="text-sm font-semibold text-indigo-600 hover:text-indigo-500" pendingLabel="Marking...">
              Mark all as read
            </PendingButton>
          </form>
        )
      }
    />
  );
}

async function NotificationsList() {
  const { notifications } = await getNotifications();
  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className={`rounded-3xl border p-5 shadow-sm transition ${
            notification.status === "UNREAD" ? "border-indigo-200 bg-white" : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-[0.3em]">{notification.type.replace(/_/g, " ")}</span>
            <time>{new Date(notification.createdAt).toLocaleString()}</time>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{notification.title}</h3>
          {notification.body && <p className="mt-1 text-sm text-slate-600">{notification.body}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <StatusBadge status={notification.status} />
            {notification.meta?.depositId != null && (
              <Link href="/deposits" className="font-semibold text-indigo-600 hover:text-indigo-500">
                View deposit →
              </Link>
            )}
            {notification.meta?.withdrawalId != null && (
              <Link href="/deposits" className="font-semibold text-indigo-600 hover:text-indigo-500">
                View withdrawal →
              </Link>
            )}
          </div>
        </article>
      ))}
      {notifications.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          No notifications yet.
        </div>
      )}
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="mt-3 h-6 w-48 rounded bg-slate-100" />
      <div className="mt-2 h-4 w-64 rounded bg-slate-100" />
    </div>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-3 w-32 rounded bg-slate-200 animate-pulse" />
          <div className="mt-3 h-5 w-48 rounded bg-slate-200 animate-pulse" />
          <div className="mt-2 h-4 w-full rounded bg-slate-100 animate-pulse" />
          <div className="mt-2 h-4 w-1/2 rounded bg-slate-100 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

async function markAllReadAction() {
  "use server";
  await backendFetch("/api/notifications/read", {
    method: "POST",
    body: JSON.stringify({}),
  });
  revalidatePath("/notifications");
  revalidatePath("/");
}
