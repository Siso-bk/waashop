"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createPromoCardAction } from "@/app/vendor/actions";
import { PendingButton } from "@/components/PendingButton";

const initialState = { error: "" };

export function VendorPromoForm({ disabled }: { disabled?: boolean }) {
  const [state, action] = useActionState(createPromoCardAction, initialState);
  const { pending } = useFormStatus();
  const isLocked = disabled || pending;
  const [imageUrl, setImageUrl] = useState("");

  return (
    <form action={action} className="space-y-4" suppressHydrationWarning>
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="promoTitle">
          Promo title
        </label>
        <input
          id="promoTitle"
          name="promoTitle"
          required
          disabled={isLocked}
          suppressHydrationWarning
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="promoDescription">
          Description
        </label>
        <textarea
          id="promoDescription"
          name="promoDescription"
          rows={3}
          disabled={isLocked}
          suppressHydrationWarning
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-600">
          CTA label
          <input
            name="promoCtaLabel"
            disabled={isLocked}
            suppressHydrationWarning
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Open drop"
          />
        </label>
        <label className="text-sm font-medium text-slate-600">
          CTA URL
          <input
            name="promoCtaHref"
            disabled={isLocked}
            suppressHydrationWarning
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="/boxes/BOX_123"
          />
        </label>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="promoImageUrl">
          Image URL (optional)
        </label>
        <input
          id="promoImageUrl"
          name="promoImageUrl"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
          disabled={isLocked}
          suppressHydrationWarning
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="https://..."
        />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            Upload
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isLocked}
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
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Promo preview" className="h-36 w-full object-cover" />
          </div>
        )}
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <PendingButton
        pendingLabel="Submitting..."
        disabled={isLocked}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Submit promo card
      </PendingButton>
    </form>
  );
}
