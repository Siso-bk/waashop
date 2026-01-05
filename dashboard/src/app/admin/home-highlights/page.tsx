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
  const totalCards = cards.length;
  const cardsWithGuestCta = cards.filter((card) => Boolean(card.guestCtaLabel || card.guestCtaHref)).length;
  const cardsWithAuthedCta = cards.filter((card) => Boolean(card.authedCtaLabel || card.authedCtaHref)).length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Admin</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Home Highlights</h1>
            <p className="mt-2 text-sm text-slate-600">
              Shape the value props beneath the hero. Keep copy concise and action driven.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            <span className="rounded-full border border-slate-200 px-3 py-2">Total {totalCards}</span>
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-indigo-700">
              Guest CTAs {cardsWithGuestCta}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
              Signed-in CTAs {cardsWithAuthedCta}
            </span>
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Copy checklist</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Keep titles under 45 characters for mobile readability.</li>
              <li>Match CTA labels to the destination (“View wallet”, “Shop now”).</li>
              <li>Use the same tone across cards to feel cohesive.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Design tip</p>
            <p className="mt-2">Pick one highlight to be the “hero” and give it the strongest CTA.</p>
          </div>
        </div>
      </section>
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
        <fieldset key={card.key} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <legend className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Card {index + 1}
          </legend>
          <input type="hidden" name={`card-${index}-key`} defaultValue={card.key} />
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-[0.2em]">Preview:</span>{" "}
            <span className="text-slate-700">
              {card.title || "Highlight title"} — {card.description || "Add a short description."}
            </span>
          </div>
          <div
            className={`preview-theme rounded-2xl border p-4 ${card.backgroundClass || "bg-white"} ${card.borderClass || "border-slate-200"}`}
          >
            <p className={`text-xs uppercase tracking-[0.3em] ${card.textClass || "text-slate-500"}`}>
              {card.eyebrow || "Eyebrow"}
            </p>
            <p className={`mt-2 text-lg font-semibold ${card.textClass || "text-slate-900"}`}>
              {card.title || "Highlight title"}
            </p>
            <p className={`mt-2 text-sm ${card.textClass || "text-slate-600"}`}>
              {card.description || "Add a short description."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
              {(card.guestCtaLabel || card.guestCtaHref) && (
                <span className={`rounded-full border px-3 py-1 ${card.textClass || "text-slate-600"} ${card.borderClass || "border-slate-200"}`}>
                  {card.guestCtaLabel || "Guest CTA"}
                </span>
              )}
              {(card.authedCtaLabel || card.authedCtaHref) && (
                <span className={`rounded-full border px-3 py-1 ${card.textClass || "text-slate-600"} ${card.borderClass || "border-slate-200"}`}>
                  {card.authedCtaLabel || "Signed-in CTA"}
                </span>
              )}
            </div>
          </div>
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
            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Guest CTA</p>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Label</span>
                <input
                  name={`card-${index}-guestCtaLabel`}
                  defaultValue={card.guestCtaLabel || ""}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                  placeholder="Create profile"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>URL</span>
                <input
                  name={`card-${index}-guestCtaHref`}
                  defaultValue={card.guestCtaHref || ""}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                  placeholder="/login"
                />
              </label>
            </div>
            <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Signed-in CTA</p>
              <label className="space-y-2 text-sm text-slate-600">
                <span>Label</span>
                <input
                  name={`card-${index}-authedCtaLabel`}
                  defaultValue={card.authedCtaLabel || ""}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                  placeholder="View wallet"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-600">
                <span>URL</span>
                <input
                  name={`card-${index}-authedCtaHref`}
                  defaultValue={card.authedCtaHref || ""}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
                  placeholder="/wallet"
                />
              </label>
            </div>
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
