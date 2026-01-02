import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getAdminDeposits, getAdminTransfers, getAdminWithdrawals, getProfile } from "@/lib/queries";
import { backendFetch } from "@/lib/backendClient";
import { requireToken } from "@/lib/session";
import { PendingButton } from "@/components/PendingButton";

export const dynamic = "force-dynamic";

export default async function AdminDepositsPage() {
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Deposit queue" description="Review payment proofs and credit MINIS." />
      <Suspense fallback={<DepositsSkeleton />}>
        <DepositsTable />
      </Suspense>
      <PageHeader eyebrow="Admin" title="Withdrawal queue" description="Approve payout requests and confirm releases." />
      <Suspense fallback={<WithdrawalsSkeleton />}>
        <WithdrawalsTable />
      </Suspense>
      <PageHeader eyebrow="Admin" title="Transfer queue" description="Approve or reject large MINIS transfers." />
      <Suspense fallback={<TransfersSkeleton />}>
        <TransfersTable />
      </Suspense>
    </div>
  );
}

async function DepositsTable() {
  const { deposits } = await getAdminDeposits();
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Proof</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deposits.map((entry) => (
            <tr key={entry.id} className="border-t border-slate-100 align-top">
              <td className="px-4 py-3 text-xs text-slate-500">
                <p>{new Date(entry.createdAt).toLocaleString()}</p>
                {entry.reviewedAt && <p className="mt-1 text-slate-400">Reviewed {new Date(entry.reviewedAt).toLocaleString()}</p>}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">{entry.userEmail || entry.username || entry.userId}</p>
                {(entry.firstName || entry.lastName) && (
                  <p className="text-slate-400">{[entry.firstName, entry.lastName].filter(Boolean).join(" ")}</p>
                )}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900">
                {entry.amountMinis.toLocaleString()} MINIS
                {entry.currency && <p className="text-xs font-normal text-slate-500">Paid in {entry.currency}</p>}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                <p>{entry.paymentMethod}</p>
                {entry.paymentReference && <p className="text-slate-400">{entry.paymentReference}</p>}
                {entry.note && <p className="mt-1 text-slate-400">{entry.note}</p>}
              </td>
              <td className="px-4 py-3 text-xs text-indigo-600">
                {entry.proofUrl ? (
                  <a href={entry.proofUrl} target="_blank" rel="noreferrer" className="hover:underline">
                    View proof
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={entry.status} />
                {entry.adminNote && <p className="mt-1 text-xs text-slate-500">{entry.adminNote}</p>}
              </td>
              <td className="px-4 py-3">
                {entry.status === "PENDING" ? (
                  <div className="space-y-2 text-xs">
                    <form action={approveDepositAction} className="flex flex-col gap-2">
                      <input type="hidden" name="depositId" value={entry.id} />
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
                        Approve & credit
                      </PendingButton>
                    </form>
                    <form action={rejectDepositAction} className="flex flex-col gap-2">
                      <input type="hidden" name="depositId" value={entry.id} />
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
          {deposits.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                No deposit requests yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DepositsSkeleton() {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Proof</th>
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
                <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
                <div className="mt-2 h-3 w-40 rounded bg-slate-100 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
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

async function WithdrawalsTable() {
  const { withdrawals } = await getAdminWithdrawals();
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Payout</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((entry) => (
            <tr key={entry.id} className="border-t border-slate-100 align-top">
              <td className="px-4 py-3 text-xs text-slate-500">
                <p>{new Date(entry.createdAt).toLocaleString()}</p>
                {entry.reviewedAt && (
                  <p className="mt-1 text-slate-400">Reviewed {new Date(entry.reviewedAt).toLocaleString()}</p>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">{entry.userEmail || entry.username || entry.userId}</p>
                {(entry.firstName || entry.lastName) && (
                  <p className="text-slate-400">{[entry.firstName, entry.lastName].filter(Boolean).join(" ")}</p>
                )}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900">
                {entry.amountMinis.toLocaleString()} MINIS
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                <p>{entry.payoutMethod}</p>
                {entry.payoutAddress && <p className="text-slate-400">{entry.payoutAddress}</p>}
                {entry.accountName && <p className="text-slate-400">{entry.accountName}</p>}
                {entry.note && <p className="mt-1 text-slate-400">{entry.note}</p>}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={entry.status} />
                {entry.adminNote && <p className="mt-1 text-xs text-slate-500">{entry.adminNote}</p>}
              </td>
              <td className="px-4 py-3">
                {entry.status === "PENDING" ? (
                  <div className="space-y-2 text-xs">
                    <form action={approveWithdrawalAction} className="flex flex-col gap-2">
                      <input type="hidden" name="withdrawalId" value={entry.id} />
                      <input
                        type="text"
                        name="adminNote"
                        placeholder="Approval note"
                        className="rounded-xl border border-emerald-200 px-2 py-1"
                      />
                      <input
                        type="text"
                        name="payoutReference"
                        placeholder="Payout reference"
                        className="rounded-xl border border-emerald-200 px-2 py-1"
                      />
                      <PendingButton
                        pendingLabel="Approving..."
                        className="rounded-full bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-500"
                      >
                        Approve payout
                      </PendingButton>
                    </form>
                    <form action={rejectWithdrawalAction} className="flex flex-col gap-2">
                      <input type="hidden" name="withdrawalId" value={entry.id} />
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
          {withdrawals.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                No withdrawal requests yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function WithdrawalsSkeleton() {
  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Payout</th>
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
                <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
                <div className="mt-2 h-3 w-40 rounded bg-slate-100 animate-pulse" />
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

async function TransfersTable() {
  const { transfers } = await getAdminTransfers("PENDING");
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
            <th className="px-4 py-3">Note</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((entry) => (
            <tr key={entry.id} className="border-t border-slate-100 align-top">
              <td className="px-4 py-3 text-xs text-slate-500">
                <p>{new Date(entry.createdAt).toLocaleString()}</p>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">
                  {entry.senderEmail || entry.senderUsername || entry.senderId}
                </p>
                {entry.senderName && <p className="text-slate-400">{entry.senderName}</p>}
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">
                  {entry.recipientEmail || entry.recipientUsername || entry.recipientHandle}
                </p>
                {entry.recipientName && <p className="text-slate-400">{entry.recipientName}</p>}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-900">
                {entry.amountMinis.toLocaleString()} MINIS
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">{entry.feeMinis.toLocaleString()} MINIS</td>
              <td className="px-4 py-3 text-xs text-slate-600">{entry.note || "-"}</td>
              <td className="px-4 py-3">
                <div className="space-y-2 text-xs">
                  <form action={approveTransferAction} className="flex flex-col gap-2">
                    <input type="hidden" name="transferId" value={entry.id} />
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
                      Approve transfer
                    </PendingButton>
                  </form>
                  <form action={rejectTransferAction} className="flex flex-col gap-2">
                    <input type="hidden" name="transferId" value={entry.id} />
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
              </td>
            </tr>
          ))}
          {transfers.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={7}>
                No pending transfers.
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
            <th className="px-4 py-3">Note</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 3 }).map((_, idx) => (
            <tr key={idx} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
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
                <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
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

async function approveDepositAction(formData: FormData) {
  "use server";
  const depositId = formData.get("depositId");
  if (!depositId || typeof depositId !== "string") {
    return;
  }
  const adminNote = formData.get("adminNote");
  await backendFetch(`/api/admin/deposits/${depositId}/approve`, {
    method: "POST",
    body: JSON.stringify({ adminNote: typeof adminNote === "string" && adminNote.trim() ? adminNote.trim() : undefined }),
  });
  revalidatePath("/admin/deposits");
  revalidatePath("/admin/users");
  revalidatePath("/deposits");
}

async function rejectDepositAction(formData: FormData) {
  "use server";
  const depositId = formData.get("depositId");
  if (!depositId || typeof depositId !== "string") {
    return;
  }
  const adminNote = formData.get("adminNote");
  await backendFetch(`/api/admin/deposits/${depositId}/reject`, {
    method: "POST",
    body: JSON.stringify({ adminNote: typeof adminNote === "string" && adminNote.trim() ? adminNote.trim() : undefined }),
  });
  revalidatePath("/admin/deposits");
  revalidatePath("/deposits");
}

async function approveWithdrawalAction(formData: FormData) {
  "use server";
  const withdrawalId = formData.get("withdrawalId");
  if (!withdrawalId || typeof withdrawalId !== "string") {
    return;
  }
  const adminNote = formData.get("adminNote");
  const payoutReference = formData.get("payoutReference");
  await backendFetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
    method: "POST",
    body: JSON.stringify({
      adminNote: typeof adminNote === "string" && adminNote.trim() ? adminNote.trim() : undefined,
      payoutReference:
        typeof payoutReference === "string" && payoutReference.trim() ? payoutReference.trim() : undefined,
    }),
  });
  revalidatePath("/admin/deposits");
  revalidatePath("/admin/users");
  revalidatePath("/deposits");
}

async function rejectWithdrawalAction(formData: FormData) {
  "use server";
  const withdrawalId = formData.get("withdrawalId");
  if (!withdrawalId || typeof withdrawalId !== "string") {
    return;
  }
  const adminNote = formData.get("adminNote");
  await backendFetch(`/api/admin/withdrawals/${withdrawalId}/reject`, {
    method: "POST",
    body: JSON.stringify({ adminNote: typeof adminNote === "string" && adminNote.trim() ? adminNote.trim() : undefined }),
  });
  revalidatePath("/admin/deposits");
  revalidatePath("/admin/users");
  revalidatePath("/deposits");
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
    body: JSON.stringify({ adminNote: typeof adminNote === "string" && adminNote.trim() ? adminNote.trim() : undefined }),
  });
  revalidatePath("/admin/deposits");
  revalidatePath("/admin/users");
  revalidatePath("/deposits");
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
    body: JSON.stringify({ adminNote: typeof adminNote === "string" && adminNote.trim() ? adminNote.trim() : undefined }),
  });
  revalidatePath("/admin/deposits");
  revalidatePath("/admin/users");
  revalidatePath("/deposits");
}
