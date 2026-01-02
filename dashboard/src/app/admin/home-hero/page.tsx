import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { PendingButton } from "@/components/PendingButton";
import { HeroCardsEditor } from "@/components/HeroCardsEditor";
import { backendFetch } from "@/lib/backendClient";
import { getAdminHomeHero, getProfile } from "@/lib/queries";
import { requireToken } from "@/lib/session";
import { HomeHeroContent } from "@/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminHomeHeroPage({ searchParams }: PageProps) {
  const plainParams = (await Promise.resolve(searchParams ?? {})) as Record<string, string | string[] | undefined>;
  const statusValue = typeof plainParams.status === "string" ? plainParams.status : null;
  const messageValue = typeof plainParams.message === "string" ? plainParams.message : null;
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }

  const { hero } = await getAdminHomeHero();
  const status = statusValue;
  const message = messageValue ? decodeURIComponent(messageValue) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Home Hero"
        description="Manage the homepage hero cards."
      />
      {status === "updated" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Hero content updated successfully.
        </div>
      )}
      {status === "error" && message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
      )}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <HeroForm hero={hero} />
      </section>
    </div>
  );
}

function HeroForm({ hero }: { hero: HomeHeroContent }) {
  return (
    <form action={updateHomeHero} className="space-y-6">
      <input type="hidden" name="tagline" defaultValue={hero.tagline} />
      <input type="hidden" name="headline" defaultValue={hero.headline} />
      <input type="hidden" name="description" defaultValue={hero.description} />
      <input type="hidden" name="primaryCtaLabel" defaultValue={hero.primaryCtaLabel} />
      <input type="hidden" name="primaryCtaHref" defaultValue={hero.primaryCtaHref} />
      <input type="hidden" name="primaryCtaAuthedLabel" defaultValue={hero.primaryCtaAuthedLabel || ""} />
      <input type="hidden" name="primaryCtaAuthedHref" defaultValue={hero.primaryCtaAuthedHref || ""} />
      <input type="hidden" name="secondaryCtaLabel" defaultValue={hero.secondaryCtaLabel || ""} />
      <input type="hidden" name="secondaryCtaHref" defaultValue={hero.secondaryCtaHref || ""} />
      <input type="hidden" name="secondaryCtaAuthedLabel" defaultValue={hero.secondaryCtaAuthedLabel || ""} />
      <input type="hidden" name="secondaryCtaAuthedHref" defaultValue={hero.secondaryCtaAuthedHref || ""} />
      <input type="hidden" name="backgroundClass" defaultValue={hero.backgroundClass || ""} />
      <input type="hidden" name="textClass" defaultValue={hero.textClass || ""} />
      <HeroCardsEditor initialCards={hero.cards || []} />

      <div className="flex flex-wrap gap-3">
        <PendingButton
          pendingLabel="Saving..."
          className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Save hero content
        </PendingButton>
      </div>
    </form>
  );
}

async function updateHomeHero(formData: FormData) {
  "use server";

  const requireString = (key: string) => {
    const value = formData.get(key);
    if (!value || typeof value !== "string" || !value.trim()) {
      throw new Error(`Missing ${key}`);
    }
    return value.trim();
  };

  const optionalString = (key: string) => {
    const value = formData.get(key);
    if (!value || typeof value !== "string") {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  };

  try {
    const cardCount = Number(formData.get("cardCount") || 0);
      const cards = [];
      for (let index = 0; index < cardCount; index += 1) {
        const getCardValue = (key: string, required = false) => {
          const value = formData.get(`card-${index}-${key}`);
          if (required && (!value || typeof value !== "string" || !value.trim())) {
            throw new Error(`Missing ${key} for card ${index + 1}`);
          }
          return typeof value === "string" ? value.trim() : "";
        };
        const opacityRaw = getCardValue("overlayOpacity");
        const overlayOpacity = opacityRaw ? Number(opacityRaw) : undefined;
        cards.push({
          id: getCardValue("id", true),
          tagline: getCardValue("tagline") || undefined,
          title: getCardValue("title", true),
          body: getCardValue("body", true),
          imageUrl: getCardValue("imageUrl") || undefined,
          overlayOpacity,
          ctaLabel: getCardValue("ctaLabel") || undefined,
          ctaHref: getCardValue("ctaHref") || undefined,
          order: Number(getCardValue("order") || index),
          status: getCardValue("status") === "DRAFT" ? "DRAFT" : "PUBLISHED",
        });
      }

    const payload = {
      tagline: requireString("tagline"),
      headline: requireString("headline"),
      description: requireString("description"),
      primaryCtaLabel: requireString("primaryCtaLabel"),
      primaryCtaHref: requireString("primaryCtaHref"),
      primaryCtaAuthedLabel: optionalString("primaryCtaAuthedLabel"),
      primaryCtaAuthedHref: optionalString("primaryCtaAuthedHref"),
      secondaryCtaLabel: optionalString("secondaryCtaLabel"),
      secondaryCtaHref: optionalString("secondaryCtaHref"),
      secondaryCtaAuthedLabel: optionalString("secondaryCtaAuthedLabel"),
      secondaryCtaAuthedHref: optionalString("secondaryCtaAuthedHref"),
      backgroundClass: optionalString("backgroundClass"),
      textClass: optionalString("textClass"),
      cards,
    };

    await backendFetch("/api/admin/home-hero", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    revalidatePath("/admin/home-hero");
    redirect("/admin/home-hero?status=updated");
  } catch (error) {
    console.error("Home hero save error", error);
    const message = error instanceof Error ? error.message : "Unable to update hero";
    const params = new URLSearchParams({ status: "error", message: encodeURIComponent(message) });
    redirect(`/admin/home-hero?${params.toString()}`);
  }
}
