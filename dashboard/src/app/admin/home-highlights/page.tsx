import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { PendingButton } from "@/components/PendingButton";
import { backendFetch } from "@/lib/backendClient";
import { getAdminHomeHighlights, getProfile } from "@/lib/queries";
import { requireToken } from "@/lib/session";
import { HomeHighlightCard } from "@/types";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminHomeHighlightsPage({ searchParams }: Props) {
  const params = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>;
  const statusValue = typeof params.status === "string" ? params.status : null;
  const messageValue = typeof params.message === "string" ? params.message : null;
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }

  const { cards } = await getAdminHomeHighlights();
  const status = statusValue;
  const message = messageValue ? decodeURIComponent(messageValue) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Home Highlights"
        description="Control the callouts beneath the hero."
      />
      {status === "updated" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Highlights updated successfully.
        </div>
      )}
      {status === "error" && message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
      )}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <HighlightsForm cards={cards} />
      </section>
    </div>
  );
}

function HighlightsForm({ cards }: { cards: HomeHighlightCard[] }) {
  return (
    <form action={updateHomeHighlights} className="space-y-6">
      <input type="hidden" name="cardCount" value={cards.length} />
      {cards.map((card, index) => (
        <fieldset key={card.key} className="space-y-4 rounded-2xl border border-slate-200 p-4">
          <legend className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Card {index + 1}
          </legend>
          <input type="hidden" name={`card-${index}-key`} defaultValue={card.key} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-600">
              <span>Eyebrow</span>
              <input
                name={`card-${index}-eyebrow`}
                defaultValue={card.eyebrow || ""}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="New shoppers"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Title</span>
              <input
                name={`card-${index}-title`}
                defaultValue={card.title}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="Create once, shop everywhere."
              />
            </label>
          </div>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Description</span>
            <textarea
              name={`card-${index}-description`}
              defaultValue={card.description || ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              rows={3}
              placeholder="Supporting copy..."
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-600">
              <span>Guest CTA label</span>
              <input
                name={`card-${index}-guestCtaLabel`}
                defaultValue={card.guestCtaLabel || ""}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="Create profile"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Guest CTA URL</span>
              <input
                name={`card-${index}-guestCtaHref`}
                defaultValue={card.guestCtaHref || ""}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="/login"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-600">
              <span>Signed-in CTA label</span>
              <input
                name={`card-${index}-authedCtaLabel`}
                defaultValue={card.authedCtaLabel || ""}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="View wallet"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Signed-in CTA URL</span>
              <input
                name={`card-${index}-authedCtaHref`}
                defaultValue={card.authedCtaHref || ""}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="/wallet"
              />
            </label>
          </div>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Background class</span>
            <input
              name={`card-${index}-backgroundClass`}
              defaultValue={card.backgroundClass || ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="bg-white"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-600">
              <span>Text class</span>
              <input
                name={`card-${index}-textClass`}
                defaultValue={card.textClass || ""}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="text-black"
              />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Border class</span>
              <input
                name={`card-${index}-borderClass`}
                defaultValue={card.borderClass || ""}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                placeholder="border-black/10"
              />
            </label>
          </div>
        </fieldset>
      ))}
      <PendingButton
        pendingLabel="Saving..."
        className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        Save highlights
      </PendingButton>
    </form>
  );
}

async function updateHomeHighlights(formData: FormData) {
  "use server";
  const count = Number(formData.get("cardCount") || 0);
  const cards = [];
  for (let index = 0; index < count; index += 1) {
    const getValue = (key: string, required = false) => {
      const value = formData.get(`card-${index}-${key}`);
      if (required && (!value || typeof value !== "string" || !value.trim())) {
        throw new Error(`Missing ${key} for card ${index + 1}`);
      }
      return typeof value === "string" ? value.trim() : "";
    };
    cards.push({
      key: getValue("key", true),
      eyebrow: getValue("eyebrow") || undefined,
      title: getValue("title", true),
      description: getValue("description") || undefined,
      guestCtaLabel: getValue("guestCtaLabel") || undefined,
      guestCtaHref: getValue("guestCtaHref") || undefined,
      authedCtaLabel: getValue("authedCtaLabel") || undefined,
      authedCtaHref: getValue("authedCtaHref") || undefined,
      backgroundClass: getValue("backgroundClass") || undefined,
      textClass: getValue("textClass") || undefined,
      borderClass: getValue("borderClass") || undefined,
    });
  }

  try {
    await backendFetch("/api/admin/home-highlights", {
      method: "PUT",
      body: JSON.stringify({ cards }),
    });
    revalidatePath("/admin/home-highlights");
    redirect("/admin/home-highlights?status=updated");
  } catch (error) {
    console.error("Home highlights save error", error);
    const message = error instanceof Error ? error.message : "Unable to update highlights";
    const params = new URLSearchParams({ status: "error", message: encodeURIComponent(message) });
    redirect(`/admin/home-highlights?${params.toString()}`);
  }
}
