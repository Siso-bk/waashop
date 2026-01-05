import { PageHeader } from "@/components/PageHeader";
import {
  getProfile,
  getUserDeposits,
  getUserLedger,
  getUserOrders,
  getUserTransfers,
  getUserWithdrawals,
} from "@/lib/queries";
import { requireToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MinisPage() {
  await requireToken();
  const [{ user }, ledger, depositsData, withdrawalsData, transfersData, ordersData] = await Promise.all([
    getProfile(),
    getUserLedger(),
    getUserDeposits(),
    getUserWithdrawals(),
    getUserTransfers(),
    getUserOrders(),
  ]);

  const inflow = ledger.items.filter((entry) => entry.deltaMinis > 0).reduce((sum, entry) => sum + entry.deltaMinis, 0);
  const outflow = ledger.items.filter((entry) => entry.deltaMinis < 0).reduce((sum, entry) => sum + Math.abs(entry.deltaMinis), 0);
  const latestTransfers = transfersData.transfers.slice(0, 5);
  const latestOrders = ordersData.orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Wallet"
        title="Minis overview"
        description="Track your balance, ledger changes, and recent activity across deposits, withdrawals, and orders."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Current balance" value={`${user.minisBalance.toLocaleString()} MINIS`} tone="indigo" />
        <SummaryCard label="Inflow (recent)" value={`${inflow.toLocaleString()} MINIS`} tone="emerald" />
        <SummaryCard label="Outflow (recent)" value={`${outflow.toLocaleString()} MINIS`} tone="rose" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-500">Ledger activity</h2>
          <div className="mt-4 space-y-3 text-sm">
            {ledger.items.slice(0, 12).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-none">
                <div>
                  <p className="font-semibold text-slate-900">{entry.reason.replace(/_/g, " ")}</p>
                  <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <span className={`text-sm font-semibold ${entry.deltaMinis >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {entry.deltaMinis >= 0 ? "+" : "-"}
                  {Math.abs(entry.deltaMinis).toLocaleString()} MINIS
                </span>
              </div>
            ))}
            {ledger.items.length === 0 && <p className="text-sm text-slate-500">No ledger entries yet.</p>}
          </div>
        </div>

        <div className="space-y-4">
          <ActivityCard title="Deposits" items={depositsData.deposits} empty="No deposit requests yet." renderItem={(item) => (
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-slate-900">{item.amountMinis.toLocaleString()} MINIS</p>
                <p className="text-xs text-slate-500">{item.paymentMethod} · {item.status}</p>
              </div>
              <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          )} />

          <ActivityCard title="Withdrawals" items={withdrawalsData.withdrawals} empty="No withdrawal requests yet." renderItem={(item) => (
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-slate-900">{item.amountMinis.toLocaleString()} MINIS</p>
                <p className="text-xs text-slate-500">{item.payoutMethod} · {item.status}</p>
              </div>
              <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          )} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ActivityCard
          title="Transfers"
          items={latestTransfers}
          empty="No transfers yet."
          renderItem={(item) => (
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-slate-900">{item.amountMinis.toLocaleString()} MINIS</p>
                <p className="text-xs text-slate-500">To {item.recipientHandle} · {item.status}</p>
              </div>
              <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        />
        <ActivityCard
          title="Orders"
          items={latestOrders}
          empty="No orders yet."
          renderItem={(item) => (
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-slate-900">Order {item.id.slice(-6)}</p>
                <p className="text-xs text-slate-500">{item.status} · {item.amountMinis.toLocaleString()} MINIS</p>
              </div>
              <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        />
      </section>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "indigo" | "emerald" | "rose" }) {
  const toneClass =
    tone === "indigo"
      ? "text-indigo-600"
      : tone === "emerald"
        ? "text-emerald-600"
        : "text-rose-600";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function ActivityCard<T>({
  title,
  items,
  empty,
  renderItem,
}: {
  title: string;
  items: T[];
  empty: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
        <span className="text-xs text-slate-400">{items.length}</span>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        {items.slice(0, 5).map((item, index) => (
          <div key={index} className="border-b border-slate-100 pb-2 last:border-none">
            {renderItem(item)}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-500">{empty}</p>}
      </div>
    </div>
  );
}
