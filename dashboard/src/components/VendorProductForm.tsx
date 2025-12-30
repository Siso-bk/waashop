"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createVendorProductAction } from "@/app/vendor/actions";

const initialState = { error: "" };

export function VendorProductForm({ disabled }: { disabled?: boolean }) {
  const [state, action] = useActionState(createVendorProductAction, initialState);
  const { pending } = useFormStatus();

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="productName">
          Product name
        </label>
        <input
          id="productName"
          name="productName"
          required
          disabled={disabled}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="productDescription">
          Description
        </label>
        <textarea
          id="productDescription"
          name="productDescription"
          rows={3}
          disabled={disabled}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="priceCoins">
            Price (coins)
          </label>
          <input
            id="priceCoins"
            name="priceCoins"
            type="number"
            min={1}
            required
            disabled={disabled}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="guaranteedMinPoints">
            Guaranteed minimum points
          </label>
          <input
            id="guaranteedMinPoints"
            name="guaranteedMinPoints"
            type="number"
            min={1}
            required
            disabled={disabled}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="rewardTiers">
          Reward tiers JSON
        </label>
        <textarea
          id="rewardTiers"
          name="rewardTiers"
          rows={4}
          disabled={disabled}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder='Example: [\n  {"points":600,"probability":0.55},\n  {"points":800,"probability":0.25}\n]'
        />
        <p className="mt-2 text-xs text-slate-500">
          Probabilities must sum to 1. Mark jackpots with {"{ \"isTop\": true }"}.
        </p>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={disabled || pending}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {pending ? "Submitting..." : "Submit product"}
      </button>
    </form>
  );
}
