import Link from "next/link";
import { getSessionUser } from "@/lib/queries";

const demoNotifications = [
  {
    id: "n1",
    title: "Drop reminder",
    body: "The BOX_1000 drop restocks today at 18:00 UTC. Reserve a spot before it sells out.",
    timestamp: "Today · 2:00 PM",
    accent: "bg-black text-white",
  },
  {
    id: "n2",
    title: "Wallet synced",
    body: "We refreshed your MINIS balance across Waashop and Telegram.",
    timestamp: "Yesterday · 9:14 AM",
    accent: "bg-white text-black",
  },
  {
    id: "n3",
    title: "Vendor spotlight",
    body: "New verified vendor: Urban Nomad. Expect apparel drops within 48 hours.",
    timestamp: "2 days ago",
    accent: "bg-white text-black",
  },
];

export default async function NotificationsPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-600">Sign in to view your Waashop alerts.</p>
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
          {user.email}
        </div>
      </header>

      <section className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        {demoNotifications.map((item, index) => (
          <article
            key={item.id}
            className={`rounded-2xl border border-black/10 p-4 ${index === 0 ? "bg-black text-white" : "bg-white text-black"}`}
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-500">
              <span>{item.title}</span>
              <span className="text-[10px] tracking-[0.3em]">{item.timestamp}</span>
            </div>
            <p className="mt-3 text-sm text-black/80 dark:text-white/80">{item.body}</p>
          </article>
        ))}
        <div className="rounded-2xl border border-dashed border-black/10 p-4 text-center text-sm text-gray-500">
          Real-time notifications will appear here as Waashop events occur.
        </div>
      </section>
    </div>
  );
}
