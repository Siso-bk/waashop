import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { backendFetch } from "@/lib/backendClient";
import { getAdminHomeHero, getProfile } from "@/lib/queries";
import { requireToken } from "@/lib/session";
import { HomeHeroContent } from "@/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function AdminHomeHeroPage({ searchParams }: PageProps) {
  await requireToken();
  const { user } = await getProfile();
  if (!user.roles.includes("admin")) {
    redirect("/");
  }

  const { hero } = await getAdminHomeHero();
  const status = typeof searchParams?.status === "string" ? searchParams.status : null;
  const message = typeof searchParams?.message === "string" ? decodeURIComponent(searchParams.message) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Home Hero"
        description="Control the headline, description, and CTAs on Waashop's homepage."
      />
      {status === "updated" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Hero content updated successfully.
        </div>
      )}
      {status === "error" && message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <HeroForm hero={hero} />
        </section>
        <section className="rounded-3xl border border-black/10 bg-gradient-to-br from-slate-900 via-black to-slate-800 p-6 text-white shadow-lg">
          <HeroPreview hero={hero} />
        </section>
      </div>
    </div>
  );
}

function HeroForm({ hero }: { hero: HomeHeroContent }) {
  return (
    <form action={updateHomeHero} className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Copy</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-600">
            <span>Tagline</span>
            <input
              name="tagline"
              defaultValue={hero.tagline}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="Waashop"
              required
            />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Main headline</span>
            <input
              name="headline"
              defaultValue={hero.headline}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="Mystery drops..."
              required
            />
          </label>
        </div>
        <label className="mt-4 block space-y-2 text-sm text-slate-600">
          <span>Description</span>
          <textarea
            name="description"
            defaultValue={hero.description}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
            rows={4}
            placeholder="Explain the value prop..."
            required
          />
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <fieldset className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <legend className="px-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Guest CTA</legend>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Button label</span>
            <input
              name="primaryCtaLabel"
              defaultValue={hero.primaryCtaLabel}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="Sign in"
              required
            />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Destination URL</span>
            <input
              name="primaryCtaHref"
              defaultValue={hero.primaryCtaHref}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="/login"
              required
            />
          </label>
        </fieldset>
        <fieldset className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <legend className="px-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Signed-in CTA (optional)
          </legend>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Button label</span>
            <input
              name="primaryCtaAuthedLabel"
              defaultValue={hero.primaryCtaAuthedLabel || ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="Continue shopping"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Destination URL</span>
            <input
              name="primaryCtaAuthedHref"
              defaultValue={hero.primaryCtaAuthedHref || ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="/boxes/BOX_1000"
            />
          </label>
        </fieldset>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <fieldset className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <legend className="px-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Secondary CTA (optional)
          </legend>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Button label</span>
            <input
              name="secondaryCtaLabel"
              defaultValue={hero.secondaryCtaLabel || ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="Wallet & ledger"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Destination URL</span>
            <input
              name="secondaryCtaHref"
              defaultValue={hero.secondaryCtaHref || ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="/wallet"
            />
          </label>
        </fieldset>
        <fieldset className="space-y-3 rounded-2xl border border-slate-200 p-4">
          <legend className="px-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Signed-in secondary CTA
          </legend>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Button label</span>
            <input
              name="secondaryCtaAuthedLabel"
              defaultValue={hero.secondaryCtaAuthedLabel || ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="Wallet & ledger"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Destination URL</span>
            <input
              name="secondaryCtaAuthedHref"
              defaultValue={hero.secondaryCtaAuthedHref || ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="/wallet"
            />
          </label>
        </fieldset>
      </div>

      <fieldset className="space-y-3 rounded-2xl border border-slate-200 p-4">
        <legend className="px-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Styling</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-600">
            <span>Background class</span>
            <input
              name="backgroundClass"
              defaultValue={hero.backgroundClass || ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="bg-black"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-600">
            <span>Text class</span>
            <input
              name="textClass"
              defaultValue={hero.textClass || ""}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900"
              placeholder="text-white"
            />
          </label>
        </div>
        <p className="text-xs text-slate-500">
          Leave these blank to fall back to the default Waashop hero styling (black background, white text).
        </p>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Save hero content
        </button>
      </div>
    </form>
  );
}

function HeroPreview({ hero }: { hero: HomeHeroContent }) {
  return (
    <div className="space-y-4">
      <div className="text-xs uppercase tracking-[0.35em] text-white/60">{hero.tagline}</div>
      <h2 className="text-3xl font-semibold leading-tight text-white">{hero.headline}</h2>
      <p className="text-sm text-white/70">{hero.description}</p>
      <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
        <span className="rounded-full bg-white/10 px-4 py-2 text-white">
          Guest CTA: {hero.primaryCtaLabel} · {hero.primaryCtaHref}
        </span>
        <span className="rounded-full bg-white/5 px-4 py-2 text-white/80">
          Signed-in CTA: {hero.primaryCtaAuthedLabel || "—"} · {hero.primaryCtaAuthedHref || "—"}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-white/70">
        <span>Secondary: {hero.secondaryCtaLabel || "—"} → {hero.secondaryCtaHref || "—"}</span>
        <span>Authed secondary: {hero.secondaryCtaAuthedLabel || "—"} → {hero.secondaryCtaAuthedHref || "—"}</span>
      </div>
      <div className="text-xs text-white/60">
        Classes: {hero.backgroundClass || "bg-black"} · {hero.textClass || "text-white"}
      </div>
    </div>
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
