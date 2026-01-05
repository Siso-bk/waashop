import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PendingButton } from "@/components/PendingButton";
import { backendFetch } from "@/lib/backendClient";
import { getProfile } from "@/lib/queries";
import { requireToken } from "@/lib/session";
import { PromoImageFormClient } from "./PromoImageFormClient";

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
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Promo cards" description="Review sponsored cards before they go live." />
      <Suspense fallback={<PromoSkeleton />}>
        <PromoTable />
      </Suspense>
    </div>
  );
}

async function PromoTable() {
  const { promoCards } = await backendFetch<{ promoCards: PromoCardAdmin[] }>("/api/admin/promo-cards");
  return (
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
                {card.imageUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={card.imageUrl} alt={card.title} className="h-28 w-full object-cover" />
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{card.vendor || "Unknown vendor"}</td>
              <td className="px-4 py-3">{card.status && <StatusBadge status={card.status} />}</td>
              <td className="px-4 py-3">
                <div className="space-y-2">
                  <PromoStatusForm cardId={card.id} current={card.status || "PENDING"} />
                  <PromoImageFormClient action={updatePromoImage} card={card} />
                  <form action={deletePromoCard}>
                    <input type="hidden" name="cardId" value={card.id} />
                    <PendingButton pendingLabel="Deleting..." className="text-xs font-semibold text-red-500">
                      Delete
                    </PendingButton>
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
  );
}

function PromoSkeleton() {
  return (
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
          {Array.from({ length: 4 }).map((_, idx) => (
            <tr key={idx} className="border-t border-slate-100">
              <td className="px-4 py-3">
                <div className="h-4 w-48 rounded bg-slate-200 animate-pulse" />
                <div className="mt-2 h-3 w-56 rounded bg-slate-100 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-32 rounded bg-slate-200 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-16 rounded-full bg-slate-100 animate-pulse" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-28 rounded bg-slate-100 animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
      <PendingButton pendingLabel="Updating..." className="rounded-lg bg-indigo-600 px-3 py-2 text-white">
        Update
      </PendingButton>
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

async function updatePromoImage(formData: FormData) {
  "use server";
  const cardId = formData.get("cardId");
  if (!cardId || typeof cardId !== "string") return;
  const imageUrl = formData.get("imageUrl");
  await backendFetch(`/api/admin/promo-cards/${cardId}`, {
    method: "PATCH",
    body: JSON.stringify({ imageUrl }),
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
