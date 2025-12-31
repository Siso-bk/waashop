import { getSessionUser } from "@/lib/queries";

export default async function OrdersPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-black/20 bg-white p-6 text-sm text-gray-600">
        Sign in to view your orders.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-black">Orders</h1>
      <p className="mt-2 text-sm text-gray-600">
        Order history and curated receipts will live here. For now, check your ledger for recent actions.
      </p>
    </div>
  );
}
