"use client";

import { useActionState } from "react";
import { submitVendorProfileAction } from "@/app/vendor/actions";
import { VendorProfile } from "@/types";
import { PendingButton } from "@/components/PendingButton";

const initialState = { error: "" };

export function VendorProfileForm({ vendor }: { vendor: VendorProfile | null }) {
  const [state, action] = useActionState(submitVendorProfileAction, initialState);
  const primaryLabel = vendor ? "Update profile" : "Submit for approval";

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="name">
          Vendor name
        </label>
        <input
          id="name"
          name="name"
          defaultValue={vendor?.name}
          required
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={vendor?.description}
          rows={3}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          placeholder="Tell customers about your shop"
        />
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <PendingButton
        pendingLabel="Saving..."
        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-400"
      >
        {primaryLabel}
      </PendingButton>
    </form>
  );
}
