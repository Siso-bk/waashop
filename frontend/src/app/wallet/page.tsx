import { getSessionUser, getRecentLedger } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { LedgerTable } from "@/components/LedgerTable";

export default async function WalletPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-black/20 bg-white p-6 text-sm text-gray-600">
        Sign in to view your wallet history.
      </div>
    );
  }

  const entries = await getRecentLedger(50);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Wallet</p>
        <h1 className="text-2xl font-semibold text-black">Balances & ledger</h1>
        <p className="text-sm text-gray-600">Track every debit and credit in one place.</p>
      </header>
      <BalancePanel coins={user.coinsBalance} points={user.pointsBalance} />
      <LedgerTable entries={entries} />
    </div>
  );
}
