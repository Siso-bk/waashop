import Link from "next/link";
import { getNotifications, getSessionUser } from "@/lib/queries";
import { NotificationsClient } from "@/components/NotificationsClient";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  const notifications = user ? await getNotifications() : [];

  if (!user) {
    return (
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-600">Sign in to view your Waashop alerts.</p>
        <p className="text-xs text-gray-500">Use your email or username@pai.</p>
        <Link
          href="/login?redirect=/notifications"
          className="inline-flex rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Notifications</p>
          <h1 className="text-2xl font-semibold text-black">Inbox</h1>
          <p className="text-sm text-gray-600">Account updates, drop reminders, and system notices.</p>
        </div>
        <div className="rounded-full border border-black px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-500">
          {user.username ? `${user.username}@pai` : user.email}
        </div>
      </header>

      <NotificationsClient initialNotifications={notifications} />
    </div>
  );
}
