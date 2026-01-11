import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getAdminTransfers, getProfile } from "@/lib/queries";
import { backendFetch } from "@/lib/backendClient";
import { requireToken } from "@/lib/session";
import { PendingButton } from "@/components/PendingButton";

export const dynamic = "force-dynamic";

export default async function AdminTransfersPage() {
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Transfer approvals"
        description="Review high-value transfers before they reach recipients."
      />
      <Suspense fallback={<TransfersSkeleton />}>
        <TransfersTable />
      </Suspense>
    </div>
  );
}

async function TransfersTable() {
  const { transfers } = await getAdminTransfers();
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Sender</th>
            <th className="px-4 py-3">Recipient</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Fee</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer) => (
            <tr key={transfer.id} className="border-t border-slate-100 align-top">
              <td className="px-4 py-3 text-xs text-slate-500">
                <p>{new Date(transfer.createdAt).toLocaleString()}</p>
                {transfer.reviewedAt && (
                  <p className="mt-1 text-slate-400">
                    Reviewed {new Date(transfer.reviewedAt).toLocaleString()}
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">
                  {transfer.senderName || transfer.senderUsername || transfer.senderEmail || transfer.senderId}
                </p>
                {transfer.senderEmail && <p className="text-slate-400">{transfer.senderEmail}</p>}
                {transfer.note && <p className="mt-1 text-slate-400">{transfer.note}</p>}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">
                  {transfer.recipientName ||
                    transfer.recipientUsername ||
                    transfer.recipientEmail ||
                    transfer.recipientHandle}
                </p>
                {transfer.recipientHandle && <p className="text-slate-400">{transfer.recipientHandle}</p>}
                {transfer.recipientEmail && <p className="text-slate-400">{transfer.recipientEmail}</p>}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900">
                {transfer.amountMinis.toLocaleString()} MINIS
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                {transfer.feeMinis.toLocaleString()} MINIS
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={transfer.status} />
                {transfer.adminNote && <p className="mt-1 text-xs text-slate-500">{transfer.adminNote}</p>}
              </td>
              <td className="px-4 py-3">
                {transfer.status === "PENDING" ? (
                  <div className="space-y-2 text-xs">
                    <form action={approveTransferAction} className="flex flex-col gap-2">
                      <input type="hidden" name="transferId" value={transfer.id} />
                      <input
                        type="text"
                        name="adminNote"
                        placeholder="Approval note"
                        className="rounded-xl border border-emerald-200 px-2 py-1"
                      />
                      <PendingButton
                        pendingLabel="Approving..."
                        className="rounded-full bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-500"
                      >
                        Approve
                      </PendingButton>
                    </form>
                    <form action={rejectTransferAction} className="flex flex-col gap-2">
                      <input type="hidden" name="transferId" value={transfer.id} />
                      <input
                        type="text"
                        name="adminNote"
                        placeholder="Rejection reason"
                        className="rounded-xl border border-red-200 px-2 py-1"
                      />
                      <PendingButton
                        pendingLabel="Rejecting..."
                        className="rounded-full border border-red-200 px-3 py-1.5 font-semibold text-red-600 hover:border-red-400"
                      >
                        Reject
                      </PendingButton>
                    </form>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No actions</p>
                )}
              </td>
            </tr>
          ))}
          {transfers.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                No transfers awaiting review.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TransfersSkeleton() {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Sender</th>
            <th className="px-4 py-3">Recipient</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Fee</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 4 }).map((_, idx) => (
            <tr key={idx} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
                <div className="mt-2 h-3 w-28 rounded bg-slate-100 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-16 rounded-full bg-slate-100 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-12 w-32 rounded bg-slate-100 animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function approveTransferAction(formData: FormData) {
  "use server";
  const transferId = formData.get("transferId");
  if (!transferId || typeof transferId !== "string") {
    return;
  }
  const adminNote = formData.get("adminNote");
  await backendFetch(`/api/admin/transfers/${transferId}/approve`, {
    method: "POST",
    body: JSON.stringify({
      adminNote: typeof adminNote === "string" && adminNote.trim() ? adminNote.trim() : undefined,
    }),
  });
  revalidatePath("/admin/transfers");
  revalidatePath("/admin/users");
}

async function rejectTransferAction(formData: FormData) {
  "use server";
  const transferId = formData.get("transferId");
  if (!transferId || typeof transferId !== "string") {
    return;
  }
  const adminNote = formData.get("adminNote");
  await backendFetch(`/api/admin/transfers/${transferId}/reject`, {
    method: "POST",
    body: JSON.stringify({
      adminNote: typeof adminNote === "string" && adminNote.trim() ? adminNote.trim() : undefined,
    }),
  });
  revalidatePath("/admin/transfers");
  revalidatePath("/admin/users");
}
