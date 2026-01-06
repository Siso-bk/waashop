import Link from "next/link";
import { getChallengeWins, getCustomerOrders, getSessionUser } from "@/lib/queries";
import { OrdersClient } from "@/components/OrdersClient";

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-black/20 bg-white p-6 text-sm text-gray-600">
        <p>Sign in to view your orders.</p>
        <p className="mt-2 text-xs text-gray-500">Use your email or username@pai.</p>
        <Link
          href="/login?redirect=/orders"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const [orders, challengeWins] = await Promise.all([getCustomerOrders(), getChallengeWins()]);

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Orders</p>
        <h1 className="text-2xl font-semibold text-black">Your orders</h1>
        <p className="text-sm text-gray-600">Track delivery status and report issues.</p>
      </header>
      <OrdersClient initialOrders={orders} initialChallengeWins={challengeWins} />
    </div>
  );
}
