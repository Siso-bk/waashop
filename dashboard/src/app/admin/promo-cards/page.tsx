import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { backendFetch } from "@/lib/backendClient";
import { getProfile } from "@/lib/queries";
import { requireToken } from "@/lib/session";

type PromoCardAdmin = {
  id: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
  vendor?: string | null;
  status?: string;
};

export const dynamic = "force-dynamic";

export default async function AdminPromoCardsPage() {
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    return null;
  }
  const { promoCards } = await backendFetch<{ promoCards: PromoCardAdmin[] }>("/api/admin/promo-cards");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Promo cards" description="Review sponsored cards before they go live." />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Card</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promoCards.map((card) => (
              <tr key={card.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{card.title}</p>
                  {card.description && <p className="text-xs text-slate-500">{card.description}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{card.vendor || "Unknown vendor"}</td>
                <td className="px-4 py-3">
                  {card.status && <StatusBadge status={card.status} />}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <PromoStatusForm cardId={card.id} current={card.status || "PENDING"} />
                    <form action={deletePromoCard}>
                      <input type="hidden" name="cardId" value={card.id} />
                      <button type="submit" className="text-xs font-semibold text-red-500">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {promoCards.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                  No promo cards submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PromoStatusForm({ cardId, current }: { cardId: string; current: string }) {
  return (
    <form action={updatePromoStatus} className="flex items-center gap-2 text-sm">
      <input type="hidden" name="cardId" value={cardId} />
      <select name="status" defaultValue={current} className="rounded-lg border border-slate-200 px-3 py-2">
        {["PENDING", "ACTIVE", "REJECTED"].map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <button className="rounded-lg bg-indigo-600 px-3 py-2 text-white" type="submit">
        Update
      </button>
    </form>
  );
}

async function updatePromoStatus(formData: FormData) {
  "use server";
  const cardId = formData.get("cardId");
  const status = formData.get("status");
  if (!cardId || !status) {
    return;
  }
  await backendFetch(`/api/admin/promo-cards/${cardId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/promo-cards");
}

async function deletePromoCard(formData: FormData) {
  "use server";
  const cardId = formData.get("cardId");
  if (!cardId) return;
  await backendFetch(`/api/admin/promo-cards/${cardId}`, { method: "DELETE" });
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/promo-cards");
}
