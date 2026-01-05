import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { PendingButton } from "@/components/PendingButton";
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
      <PageHeader eyebrow="Admin" title="Platform settings" description="Update fees and transfer rules." />
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <form action={updateFees} className="space-y-4">
          <label className="block text-sm text-slate-600">
            Mystery box fee (MINI)
            <input
              name="feeMysteryBox"
              type="number"
              min={0}
              defaultValue={settings.feeMysteryBox}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-600">
            Mystery box platform fee (%)
            <input
              name="feeMysteryBoxPercent"
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={settings.feeMysteryBoxPercent}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-600">
            Challenge fee (MINI)
            <input
              name="feeChallenge"
              type="number"
              min={0}
              defaultValue={settings.feeChallenge}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-600">
            Promo card fee (MINI)
            <input
              name="feePromoCard"
              type="number"
              min={0}
              defaultValue={settings.feePromoCard}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-600">
            Top winner fee (%)
            <input
              name="feeTopWinnerPercent"
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={settings.feeTopWinnerPercent}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-slate-600">
              Transfer auto-approve limit (MINIS)
              <input
                name="transferLimitMinis"
                type="number"
                min={0}
                step={1}
                defaultValue={settings.transferLimitMinis}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm text-slate-600">
              Transfer fee (%)
              <input
                name="transferFeePercent"
                type="number"
                min={0}
                max={100}
                step={0.1}
                defaultValue={settings.transferFeePercent}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
          <PendingButton
            pendingLabel="Saving..."
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Save changes
          </PendingButton>
        </form>
      </section>
    </div>
  );
}

async function updateFees(formData: FormData) {
  "use server";
  const payload = {
    feeMysteryBox: Number(formData.get("feeMysteryBox")),
    feeMysteryBoxPercent: Number(formData.get("feeMysteryBoxPercent")),
    feeChallenge: Number(formData.get("feeChallenge")),
    feePromoCard: Number(formData.get("feePromoCard")),
    feeTopWinnerPercent: Number(formData.get("feeTopWinnerPercent")),
    transferLimitMinis: Number(formData.get("transferLimitMinis")),
    transferFeePercent: Number(formData.get("transferFeePercent")),
  };
  await backendFetch("/api/admin/settings/fees", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  revalidatePath("/admin/settings");
}
