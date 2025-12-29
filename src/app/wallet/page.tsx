import { getSessionUser } from "@/lib/auth";
import { getRecentLedger } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { LedgerTable } from "@/components/LedgerTable";

export default async function WalletPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
        Connect via Telegram to view your wallet history.
      </div>
    );
  }

  const entries = await getRecentLedger(user, 50);
  const mapped = entries.map((entry) => ({
    id: entry._id.toString(),
    deltaCoins: entry.deltaCoins,
    deltaPoints: entry.deltaPoints,
    reason: entry.reason,
    meta: entry.meta || {},
    createdAt: entry.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Wallet</h1>
        <p className="text-sm text-gray-500">Track every debit and credit for transparency.</p>
      </header>
      <BalancePanel coins={user.coinsBalance} points={user.pointsBalance} />
      <LedgerTable entries={mapped} />
    </div>
  );
}
