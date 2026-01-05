import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PendingButton } from "@/components/PendingButton";
import { requireToken } from "@/lib/session";
import { getProfile } from "@/lib/queries";
import { backendFetch } from "@/lib/backendClient";
import { WinnerFormClient } from "./WinnerFormClient";
import { ClearImageFormClient } from "./ClearImageFormClient";

export const dynamic = "force-dynamic";

type WinnerEntry = {
  id: string;
  winnerType: "CHALLENGE" | "MYSTERY_BOX";
  winnerName: string;
  headline: string;
  description?: string;
  imageUrl?: string;
  status: "PENDING" | "PUBLISHED";
};

async function fetchWinners() {
  const response = await backendFetch<{ winners: WinnerEntry[] }>("/api/admin/winners");
  return response.winners;
}

export default async function AdminWinnersPage() {
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Winner spotlights" description="Highlight recent challenge or mystery winners." />
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <WinnerFormClient action={createWinner} />
      </section>
      <Suspense fallback={<WinnersSkeleton />}>
        <WinnersTable />
      </Suspense>
    </div>
  );
}

async function WinnersTable() {
  const winners = await fetchWinners();
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Winner</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {winners.map((entry) => (
            <tr key={entry.id} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <div className="flex items-start gap-3">
                  {entry.imageUrl && (
                    <div className="h-12 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                      <img src={entry.imageUrl} alt={entry.headline} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{entry.headline}</p>
                    <p className="text-xs text-slate-500">{entry.winnerName}</p>
                    {entry.description && <p className="text-xs text-slate-500">{entry.description}</p>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{entry.winnerType}</td>
              <td className="px-4 py-3">
                <StatusBadge status={entry.status} />
              </td>
              <td className="px-4 py-3">
                <form action={updateWinnerStatus} className="flex flex-wrap items-center gap-2 text-xs">
                  <input type="hidden" name="winnerId" value={entry.id} />
                  <select name="status" defaultValue={entry.status} className="rounded-md border border-slate-200 px-2 py-1">
                    <option value="PENDING">Pending</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                  <input
                    name="imageUrl"
                    defaultValue={entry.imageUrl || ""}
                    placeholder="Image URL (optional)"
                    className="min-w-[160px] flex-1 rounded-md border border-slate-200 px-2 py-1"
                  />
                  <PendingButton pendingLabel="Updating..." className="rounded-md bg-indigo-600 px-3 py-1 text-white">
                    Update
                  </PendingButton>
                </form>
                <ClearImageFormClient action={updateWinnerStatus} winnerId={entry.id} status={entry.status} />
                <form action={deleteWinner}>
                  <input type="hidden" name="winnerId" value={entry.id} />
                  <PendingButton pendingLabel="Removing..." className="text-xs font-semibold text-red-500">
                    Remove
                  </PendingButton>
                </form>
              </td>
            </tr>
          ))}
          {winners.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                No winners posted yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function WinnersSkeleton() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Winner</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 4 }).map((_, idx) => (
            <tr key={idx} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-200 animate-pulse" />
                  <div>
                    <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
                    <div className="mt-2 h-3 w-40 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-16 rounded-full bg-slate-100 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-8 w-32 rounded bg-slate-100 animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function createWinner(formData: FormData) {
  "use server";
  const payload = {
    winnerType: formData.get("winnerType"),
    winnerName: formData.get("winnerName"),
    headline: formData.get("headline"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl") || undefined,
  };
  await backendFetch("/api/admin/winners", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  revalidatePath("/admin/winners");
}

async function updateWinnerStatus(formData: FormData) {
  "use server";
  const winnerId = formData.get("winnerId");
  const status = formData.get("status");
  if (!winnerId || !status) return;
  const imageUrl = formData.get("imageUrl");
  const payload: Record<string, unknown> = { status };
  if (typeof imageUrl === "string") {
    payload.imageUrl = imageUrl.trim();
  }
  await backendFetch(`/api/admin/winners/${winnerId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  revalidatePath("/admin/winners");
}

async function deleteWinner(formData: FormData) {
  "use server";
  const winnerId = formData.get("winnerId");
  if (!winnerId) return;
  await backendFetch(`/api/admin/winners/${winnerId}`, { method: "DELETE" });
  revalidatePath("/admin/winners");
}
