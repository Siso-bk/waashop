import Link from "next/link";
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

type SearchParams = Record<string, string | string[] | undefined>;

export default async function MinisPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  await requireToken();
  const resolvedParams = searchParams ? await searchParams : {};
  const page = Number(
    typeof resolvedParams.page === "string" ? resolvedParams.page : Array.isArray(resolvedParams.page) ? resolvedParams.page[0] : 1
  );
  const limit = Number(
    typeof resolvedParams.limit === "string" ? resolvedParams.limit : Array.isArray(resolvedParams.limit) ? resolvedParams.limit[0] : 50
  );
  const reason =
    typeof resolvedParams.reason === "string"
      ? resolvedParams.reason
      : Array.isArray(resolvedParams.reason)
        ? resolvedParams.reason[0]
        : "";
  const start =
    typeof resolvedParams.start === "string"
      ? resolvedParams.start
      : Array.isArray(resolvedParams.start)
        ? resolvedParams.start[0]
        : "";
  const end =
    typeof resolvedParams.end === "string"
      ? resolvedParams.end
      : Array.isArray(resolvedParams.end)
        ? resolvedParams.end[0]
        : "";

  const [{ user }, ledger, depositsData, withdrawalsData, transfersData, ordersData] = await Promise.all([
    getProfile(),
    getUserLedger(page || 1, limit || 50, reason || undefined, start || undefined, end || undefined),
    getUserDeposits(),
    getUserWithdrawals(),
    getUserTransfers(),
    getUserOrders(),
  ]);

  const inflow = ledger.items
    .filter((entry) => entry.deltaMinis > 0)
    .reduce((sum, entry) => sum + entry.deltaMinis, 0);
  const outflow = ledger.items
    .filter((entry) => entry.deltaMinis < 0)
    .reduce((sum, entry) => sum + Math.abs(entry.deltaMinis), 0);
  const escrowHeld = (ordersData.orders ?? [])
    .filter((order) => !order.escrowReleased && !["COMPLETED", "REFUNDED", "CANCELLED"].includes(order.status))
    .reduce((sum, order) => sum + (order.amountMinis ?? 0), 0);
  const latestTransfers = (transfersData.transfers ?? []).slice(0, 5);
  const latestOrders = (ordersData.orders ?? []).slice(0, 5);

  const escrowOrders = (ordersData.orders ?? []).filter(
    (order) => !order.escrowReleased && !["COMPLETED", "REFUNDED", "CANCELLED"].includes(order.status)
  );
  const totalPages = Math.max(1, Math.ceil(ledger.total / ledger.pageSize));
  const dailyBuckets = buildDailyBuckets(ledger.items);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Wallet"
        title="Minis overview"
        description="Track your balance, ledger changes, and recent activity across deposits, withdrawals, and orders."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          label="Current balance"
          value={`${user.minisBalance.toLocaleString()} MINIS`}
          tone="indigo"
          detail="Live wallet balance across all activities."
        />
        <SummaryCard
          label="Inflow (recent)"
          value={`${inflow.toLocaleString()} MINIS`}
          tone="emerald"
          detail={`Sum of positive ledger entries (page ${ledger.page}).`}
        />
        <SummaryCard
          label="Outflow (recent)"
          value={`${outflow.toLocaleString()} MINIS`}
          tone="rose"
          detail={`Sum of negative ledger entries (page ${ledger.page}).`}
        />
        <SummaryCard
          label="Escrow held"
          value={`${escrowHeld.toLocaleString()} MINIS`}
          tone="amber"
          detail={`${escrowOrders.length} order(s) awaiting delivery confirmation.`}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Ledger filters</p>
            <h2 className="text-lg font-semibold text-slate-900">Filter your activity</h2>
          </div>
          <form className="flex flex-wrap gap-3 text-xs">
            <input
              type="text"
              name="reason"
              defaultValue={reason}
              placeholder="Reason (e.g., transfer)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input type="date" name="start" defaultValue={start} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input type="date" name="end" defaultValue={end} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <select name="limit" defaultValue={String(limit || 50)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {[25, 50, 75, 100].map((value) => (
                <option key={value} value={value}>
                  {value} / page
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
              Apply
            </button>
          </form>
        </div>
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Inflow / outflow</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-7">
            {dailyBuckets.map((bucket) => (
              <div key={bucket.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] text-slate-500">{bucket.label}</p>
                <div className="mt-2 h-10 w-full rounded bg-slate-100">
                  <div
                    className="h-10 rounded bg-gradient-to-r from-emerald-400 to-indigo-500"
                    style={{ width: `${bucket.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  +{bucket.inflow.toLocaleString()} / -{bucket.outflow.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
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
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {ledger.page} of {totalPages} · {ledger.total} entries
            </span>
            <div className="flex items-center gap-2">
              <PagerLink
                disabled={ledger.page <= 1}
                href={buildQuery({ page: ledger.page - 1, limit, reason, start, end })}
              >
                Prev
              </PagerLink>
              <PagerLink
                disabled={!ledger.hasMore}
                href={buildQuery({ page: ledger.page + 1, limit, reason, start, end })}
              >
                Next
              </PagerLink>
            </div>
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
                {!item.escrowReleased && !["COMPLETED", "REFUNDED", "CANCELLED"].includes(item.status) && (
                  <p className="text-xs font-semibold text-amber-600">Escrow held</p>
                )}
              </div>
              <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Escrow</p>
            <h2 className="text-lg font-semibold text-slate-900">Funds held in escrow</h2>
          </div>
          <span className="text-xs text-slate-400">{escrowOrders.length} orders</span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {escrowOrders.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-none">
              <div>
                <p className="font-semibold text-slate-900">Order {order.id.slice(-6)}</p>
                <p className="text-xs text-slate-500">{order.status.replace(/_/g, " ")} · {new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <span className="text-sm font-semibold text-amber-600">{order.amountMinis.toLocaleString()} MINIS</span>
            </div>
          ))}
          {escrowOrders.length === 0 && <p className="text-sm text-slate-500">No escrow funds right now.</p>}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: string;
  tone: "indigo" | "emerald" | "rose" | "amber";
  detail?: string;
}) {
  const toneClass =
    tone === "indigo"
      ? "text-indigo-600"
      : tone === "emerald"
        ? "text-emerald-600"
        : tone === "amber"
          ? "text-amber-600"
          : "text-rose-600";
  return (
    <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer list-none">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
        <p className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
          View details
        </p>
      </summary>
      {detail && (
        <p className="mt-3 text-xs text-slate-500">{detail}</p>
      )}
    </details>
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

function PagerLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="rounded-lg border border-slate-200 px-3 py-1 text-slate-400">{children}</span>;
  }
  return (
    <Link href={href} className="rounded-lg border border-slate-200 px-3 py-1 text-slate-600 hover:border-indigo-300">
      {children}
    </Link>
  );
}

function buildQuery({
  page,
  limit,
  reason,
  start,
  end,
}: {
  page: number;
  limit: number;
  reason?: string;
  start?: string;
  end?: string;
}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (reason) params.set("reason", reason);
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  return `/minis?${params.toString()}`;
}

function buildDailyBuckets(items: { deltaMinis: number; createdAt: string }[]) {
  const days = 7;
  const today = new Date();
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return { key, date, inflow: 0, outflow: 0 };
  });
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  items.forEach((entry) => {
    const key = entry.createdAt.slice(0, 10);
    const bucket = bucketMap.get(key);
    if (!bucket) return;
    if (entry.deltaMinis >= 0) bucket.inflow += entry.deltaMinis;
    else bucket.outflow += Math.abs(entry.deltaMinis);
  });
  const maxValue = Math.max(
    1,
    ...buckets.map((bucket) => Math.max(bucket.inflow, bucket.outflow))
  );
  return buckets.map((bucket) => ({
    label: bucket.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    inflow: bucket.inflow,
    outflow: bucket.outflow,
    percent: Math.round((Math.max(bucket.inflow, bucket.outflow) / maxValue) * 100),
  }));
}
