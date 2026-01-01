"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createPromoCardAction } from "@/app/vendor/actions";
import { PendingButton } from "@/components/PendingButton";

const initialState = { error: "" };

export function VendorPromoForm({ disabled }: { disabled?: boolean }) {
  const [state, action] = useActionState(createPromoCardAction, initialState);
  const { pending } = useFormStatus();
  const isLocked = disabled || pending;

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="promoTitle">
          Promo title
        </label>
        <input
          id="promoTitle"
          name="promoTitle"
          required
          disabled={isLocked}
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
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-600">
          CTA label
          <input
            name="promoCtaLabel"
            disabled={isLocked}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Open drop"
          />
        </label>
        <label className="text-sm font-medium text-slate-600">
          CTA URL
          <input
            name="promoCtaHref"
            disabled={isLocked}
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
          disabled={isLocked}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="https://..."
        />
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
