"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createVendorProductAction } from "@/app/vendor/actions";
import { PendingButton } from "@/components/PendingButton";

const initialState = { error: "" };

export function VendorProductForm({ disabled }: { disabled?: boolean }) {
  const [state, action] = useActionState(createVendorProductAction, initialState);
  const { pending } = useFormStatus();
  const [productType, setProductType] = useState<"MYSTERY_BOX" | "CHALLENGE">("MYSTERY_BOX");
  const isLocked = disabled || pending;

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="productType">
          Product type
        </label>
        <select
          id="productType"
          name="type"
          value={productType}
          disabled={isLocked}
          onChange={(event) => setProductType(event.target.value as "MYSTERY_BOX" | "CHALLENGE")}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="MYSTERY_BOX">Mystery box</option>
          <option value="CHALLENGE">Challenge</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="productName">
          Product name
        </label>
        <input
          id="productName"
          name="productName"
          required
          disabled={isLocked}
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
          disabled={isLocked}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
      {productType === "MYSTERY_BOX" ? (
        <>
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
                disabled={isLocked}
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
                disabled={isLocked}
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
              disabled={isLocked}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder='Example: [\n  {"points":600,"probability":0.55},\n  {"points":800,"probability":0.25}\n]'
            />
            <p className="mt-2 text-xs text-slate-500">
              Probabilities must sum to 1. Mark jackpots with {"{ \"isTop\": true }"}.
            </p>
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="ticketPriceCoins">
              Ticket price (coins)
            </label>
            <input
              id="ticketPriceCoins"
              name="ticketPriceCoins"
              type="number"
              min={1}
              required
              disabled={isLocked}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="ticketCount">
              Ticket count
            </label>
            <input
              id="ticketCount"
              name="ticketCount"
              type="number"
              min={1}
              required
              disabled={isLocked}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
        </div>
      )}
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <PendingButton
        pendingLabel="Submitting..."
        disabled={isLocked}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Submit product
      </PendingButton>
    </form>
  );
}
