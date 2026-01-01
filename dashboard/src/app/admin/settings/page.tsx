import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getAdminSettings, getProfile } from "@/lib/queries";
import { backendFetch } from "@/lib/backendClient";
import { requireToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }
  const { settings } = await getAdminSettings();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Platform settings" description="Update submission fees." />
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={updateFees} className="space-y-4">
          <label className="block text-sm text-slate-600">
            Mystery box fee (coins)
            <input
              name="feeMysteryBox"
              type="number"
              min={0}
              defaultValue={settings.feeMysteryBox}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-600">
            Challenge fee (coins)
            <input
              name="feeChallenge"
              type="number"
              min={0}
              defaultValue={settings.feeChallenge}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-600">
            Promo card fee (coins)
            <input
              name="feePromoCard"
              type="number"
              min={0}
              defaultValue={settings.feePromoCard}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <button type="submit" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            Save changes
          </button>
        </form>
      </section>
    </div>
  );
}

async function updateFees(formData: FormData) {
  "use server";
  const payload = {
    feeMysteryBox: Number(formData.get("feeMysteryBox")),
    feeChallenge: Number(formData.get("feeChallenge")),
    feePromoCard: Number(formData.get("feePromoCard")),
  };
  await backendFetch("/api/admin/settings/fees", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  revalidatePath("/admin/settings");
}
