import { getSessionUser, getRecentLedger, getActiveBoxes } from "@/lib/queries";
import { BalancePanel } from "@/components/BalancePanel";
import { LedgerTable } from "@/components/LedgerTable";
import { BoxPurchaseButton } from "@/components/BoxPurchaseButton";
import Link from "next/link";
import { formatMinis } from "@/lib/minis";

export default async function WalletPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-black/20 bg-white p-6 text-sm text-gray-600">
        Sign in to view your wallet history.
      </div>
    );
  }

  const [entries, boxes] = await Promise.all([getRecentLedger(50), getActiveBoxes()]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Wallet</p>
        <h1 className="text-2xl font-semibold text-black">Balances & ledger</h1>
        <p className="text-sm text-gray-600">Track every debit and credit in one place.</p>
      </header>
      <BalancePanel minis={user.minisBalance ?? (user as any).coinsBalance ?? 0} />
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Play drops</p>
            <p className="text-sm text-gray-600">Keep the momentum going without leaving your wallet.</p>
          </div>
          <Link href="/shop" className="text-xs font-semibold text-black underline underline-offset-4">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {boxes.slice(0, 2).map((box) => (
            <article key={box.boxId} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Box {box.boxId}</span>
                <span className="rounded-full bg-black px-3 py-1 text-white">{formatMinis(box.priceMinis ?? 0)}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-black">{box.name}</h3>
              <p className="text-xs text-gray-500">
                Guaranteed {formatMinis(box.guaranteedMinMinis)} · top tier cooldown {box.rewardTiers.find(t => t.isTop)?.probability
                  ? `${(box.rewardTiers.find(t => t.isTop)!.probability * 100).toFixed(2)}%`
                  : "—"}
              </p>
              <div className="mt-3">
                <BoxPurchaseButton box={box} disabled={!user} />
              </div>
            </article>
          ))}
          {!boxes.length && (
            <div className="rounded-2xl border border-dashed border-black/20 bg-white p-4 text-center text-xs text-gray-500">
              No drops available right now.
            </div>
          )}
        </div>
      </section>
      <LedgerTable entries={entries} />
    </div>
  );
}
