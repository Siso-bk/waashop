import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { requireToken } from "@/lib/session";
import { getProfile } from "@/lib/queries";
import { backendFetch } from "@/lib/backendClient";

export const dynamic = "force-dynamic";

type WinnerEntry = {
  id: string;
  winnerType: "CHALLENGE" | "MYSTERY_BOX";
  winnerName: string;
  headline: string;
  description?: string;
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
  const winners = await fetchWinners();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Winner spotlights" description="Highlight recent challenge or mystery winners." />
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <CreateWinnerForm />
      </section>
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
                  <p className="font-semibold text-slate-900">{entry.headline}</p>
                  <p className="text-xs text-slate-500">{entry.winnerName}</p>
                  {entry.description && <p className="text-xs text-slate-500">{entry.description}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{entry.winnerType}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={entry.status} />
                </td>
                <td className="px-4 py-3">
                  <form action={updateWinnerStatus} className="flex items-center gap-2 text-xs">
                    <input type="hidden" name="winnerId" value={entry.id} />
                    <select name="status" defaultValue={entry.status} className="rounded-md border border-slate-200 px-2 py-1">
                      <option value="PENDING">Pending</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                    <button type="submit" className="rounded-md bg-indigo-600 px-3 py-1 text-white">
                      Update
                    </button>
                  </form>
                  <form action={deleteWinner}>
                    <input type="hidden" name="winnerId" value={entry.id} />
                    <button type="submit" className="text-xs font-semibold text-red-500">
                      Remove
                    </button>
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
    </div>
  );
}

function CreateWinnerForm() {
  return (
    <form action={createWinner} className="grid gap-4 md:grid-cols-2">
      <label className="text-sm text-slate-600">
        Winner type
        <select name="winnerType" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="CHALLENGE">Challenge</option>
          <option value="MYSTERY_BOX">Mystery box</option>
        </select>
      </label>
      <label className="text-sm text-slate-600">
        Winner name
        <input name="winnerName" required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      </label>
      <label className="text-sm text-slate-600">
        Headline
        <input name="headline" required className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      </label>
      <label className="text-sm text-slate-600">
        Description
        <textarea name="description" rows={2} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      </label>
      <div className="md:col-span-2">
        <button type="submit" className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
          Publish winner
        </button>
      </div>
    </form>
  );
}

async function createWinner(formData: FormData) {
  "use server";
  const payload = {
    winnerType: formData.get("winnerType"),
    winnerName: formData.get("winnerName"),
    headline: formData.get("headline"),
    description: formData.get("description"),
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
  await backendFetch(`/api/admin/winners/${winnerId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
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
