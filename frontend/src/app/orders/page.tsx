import { getSessionUser } from "@/lib/queries";

export default async function OrdersPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-black/20 bg-white p-6 text-sm text-gray-600">
        <p>Sign in to view your orders.</p>
        <p className="mt-2 text-xs text-gray-500">Use your email or username@pai.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Orders</p>
          <h1 className="text-2xl font-semibold text-black">Receipts & history</h1>
        </div>
        <button className="rounded-full border border-black px-3 py-1 text-xs font-semibold text-black hover:bg-black hover:text-white">
          Export
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-600">
        Order history and curated receipts will live here. For now, check your ledger for recent actions.
      </p>
    </div>
  );
}
