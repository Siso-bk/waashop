import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getAdminDeposits, getProfile } from "@/lib/queries";
import { backendFetch } from "@/lib/backendClient";
import { requireToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminDepositsPage() {
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }
  const { deposits } = await getAdminDeposits();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Deposit queue"
        description="Review customer payment proofs and credit coins instantly."
      />
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
                    <p className="text-slate-400">
                      {[entry.firstName, entry.lastName].filter(Boolean).join(" ")}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {entry.amountCoins.toLocaleString()} coins
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
                        <button
                          type="submit"
                          className="rounded-full bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-500"
                        >
                          Approve & credit
                        </button>
                      </form>
                      <form action={rejectDepositAction} className="flex flex-col gap-2">
                        <input type="hidden" name="depositId" value={entry.id} />
                        <input
                          type="text"
                          name="adminNote"
                          placeholder="Rejection reason"
                          className="rounded-xl border border-red-200 px-2 py-1"
                        />
                        <button
                          type="submit"
                          className="rounded-full border border-red-200 px-3 py-1.5 font-semibold text-red-600 hover:border-red-400"
                        >
                          Reject
                        </button>
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
