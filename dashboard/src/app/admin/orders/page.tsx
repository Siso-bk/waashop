import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { PendingButton } from "@/components/PendingButton";
import { backendFetch } from "@/lib/backendClient";
import { getAdminOrders, getProfile } from "@/lib/queries";
import { requireToken } from "@/lib/session";
import { OrderDto } from "@/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const plainParams = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>;
  const statusValue = typeof plainParams.status === "string" ? plainParams.status : null;
  const messageValue = typeof plainParams.message === "string" ? plainParams.message : null;
  const page = Number(
    typeof plainParams.page === "string" ? plainParams.page : Array.isArray(plainParams.page) ? plainParams.page[0] : 1
  );
  const limit = Number(
    typeof plainParams.limit === "string" ? plainParams.limit : Array.isArray(plainParams.limit) ? plainParams.limit[0] : 25
  );
  const q = typeof plainParams.q === "string" ? plainParams.q.trim() : "";
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }
  const { orders, total, pageSize, hasMore } = await getAdminOrders({
    status: "DISPUTED",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 25,
    q: q || undefined,
  });
  const safeTotal = Number.isFinite(total) ? total : 0;
  const safePageSize = pageSize || (Number.isFinite(limit) && limit > 0 ? limit : 25);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const startIndex = safeTotal === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const endIndex = Math.min(safePage * safePageSize, safeTotal);
  const buildQuery = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(nextPage));
    params.set("limit", String(safePageSize));
    return `?${params.toString()}`;
  };
  const status = statusValue;
  const message = messageValue ? decodeURIComponent(messageValue) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Order disputes"
        description="Resolve disputes for STANDARD product orders."
      />
      {status === "updated" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Dispute resolved successfully.
        </div>
      )}
      {status === "error" && message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <form method="GET" className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search disputes"
            className="w-56 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input type="hidden" name="limit" value={safePageSize} />
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Search</button>
        </form>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span>Search by order ID, tracking, or buyer info.</span>
          <span>Total = {safeTotal}</span>
        </div>
      </div>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {orders.map((order, index) => (
            <DisputeCard key={order.id} order={order} index={startIndex + index} />
          ))}
          {orders.length === 0 && <p className="text-sm text-slate-500">No disputed orders.</p>}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>
            Showing {startIndex}-{endIndex} of {total}
          </span>
          <span>Total = {safeTotal}</span>
          <div className="flex items-center gap-2">
            {safePage > 1 ? (
              <Link href={`/admin/orders${buildQuery(safePage - 1)}`} className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">
                Previous
              </Link>
            ) : (
              <span className="rounded-full border border-slate-100 px-3 py-1 text-slate-400">Previous</span>
            )}
            <span className="text-slate-500">
              Page {safePage} of {totalPages}
            </span>
            {hasMore ? (
              <Link href={`/admin/orders${buildQuery(safePage + 1)}`} className="rounded-full border border-slate-200 px-3 py-1 text-slate-700">
                Next
              </Link>
            ) : (
              <span className="rounded-full border border-slate-100 px-3 py-1 text-slate-400">Next</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function DisputeCard({ order, index }: { order: OrderDto; index: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">
            {index}. Order {order.id.slice(-6)}
          </p>
          <p className="text-xs text-slate-500">Amount: {order.amountMinis.toLocaleString()} MINIS</p>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          DISPUTED
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-500">
        <p>Buyer: {order.buyerId}</p>
        <p>Vendor: {order.vendorId}</p>
        <p>Shipping: {order.shippingAddress || "—"}</p>
      </div>
      <form action={resolveDispute} className="mt-4 space-y-2 text-xs">
        <input type="hidden" name="orderId" value={order.id} />
        <select name="resolution" className="w-full rounded-lg border border-slate-200 px-2 py-1">
          <option value="REFUND">Refund buyer</option>
          <option value="RELEASE">Release to vendor</option>
          <option value="REJECTED">Reject dispute</option>
        </select>
        <input
          name="adminNote"
          placeholder="Admin note (optional)"
          className="w-full rounded-lg border border-slate-200 px-2 py-1"
        />
        <PendingButton pendingLabel="Resolving..." className="rounded-lg bg-slate-900 px-3 py-1 text-white">
          Resolve dispute
        </PendingButton>
      </form>
    </div>
  );
}

async function resolveDispute(formData: FormData) {
  "use server";
  try {
    const orderId = String(formData.get("orderId") || "").trim();
    const resolution = String(formData.get("resolution") || "").trim();
    const adminNote = String(formData.get("adminNote") || "").trim();
    if (!orderId || !resolution) {
      throw new Error("Missing order or resolution.");
    }
    await backendFetch(`/api/admin/orders/${orderId}/resolve`, {
      method: "POST",
      body: JSON.stringify({
        resolution,
        adminNote: adminNote || undefined,
      }),
    });
    revalidatePath("/admin/orders");
    redirect("/admin/orders?status=updated");
  } catch (error) {
    console.error("Resolve dispute error", error);
    const message = error instanceof Error ? error.message : "Unable to resolve dispute";
    const params = new URLSearchParams({ status: "error", message: encodeURIComponent(message) });
    redirect(`/admin/orders?${params.toString()}`);
  }
}
