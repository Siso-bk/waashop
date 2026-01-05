"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { PromoCardDto } from "@/types";
import { PendingButton } from "@/components/PendingButton";

type PromoEditFormClientProps = {
  action: (formData: FormData) => void;
  card: PromoCardDto;
};

export function PromoEditFormClient({ action, card }: PromoEditFormClientProps) {
  const { pending } = useFormStatus();
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [ctaLabel, setCtaLabel] = useState(card.ctaLabel || "");
  const [ctaHref, setCtaHref] = useState(card.ctaHref || "");
  const [imageUrl, setImageUrl] = useState(card.imageUrl || "");

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="promoId" value={card.id} />
      <input
        name="promoTitle"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      <textarea
        name="promoDescription"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={2}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      <input
        name="promoCtaLabel"
        value={ctaLabel}
        onChange={(event) => setCtaLabel(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        placeholder="CTA label"
      />
      <input
        name="promoCtaHref"
        value={ctaHref}
        onChange={(event) => setCtaHref(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        placeholder="/boxes/BOX_123"
      />
      <input
        name="promoImageUrl"
        value={imageUrl}
        onChange={(event) => setImageUrl(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        placeholder="https://..."
      />
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
          Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 1024 * 1024) {
                window.alert("Please use an image under 1MB.");
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") {
                  setImageUrl(reader.result);
                }
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
        {imageUrl && (
          <button
            type="button"
            onClick={() => setImageUrl("")}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
          >
            Clear
          </button>
        )}
        <span>Uploads store as data URLs. Use hosted URLs for production.</span>
      </div>
      {imageUrl && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={title} className="h-36 w-full object-cover" />
        </div>
      )}
      <PendingButton pendingLabel="Saving..." disabled={pending} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
        Save promo
      </PendingButton>
    </form>
  );
}
