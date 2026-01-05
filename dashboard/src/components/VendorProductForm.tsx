"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createVendorProductAction } from "@/app/vendor/actions";
import { PendingButton } from "@/components/PendingButton";

const initialState = { error: "" };

export function VendorProductForm({ disabled }: { disabled?: boolean }) {
  const [state, action] = useActionState(createVendorProductAction, initialState);
  const { pending } = useFormStatus();
  const [productType, setProductType] = useState<"MYSTERY_BOX" | "CHALLENGE" | "STANDARD">("MYSTERY_BOX");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [priceMinis, setPriceMinis] = useState("");
  const [guaranteedMinMinis, setGuaranteedMinMinis] = useState("");
  const [totalTries, setTotalTries] = useState("");
  const [fundingMinis, setFundingMinis] = useState("");
  const [ticketPriceMinis, setTicketPriceMinis] = useState("");
  const [ticketCount, setTicketCount] = useState("");
  const [tiers, setTiers] = useState([
    { minis: "600", probability: "0.55", isTop: false },
    { minis: "800", probability: "0.25", isTop: false },
    { minis: "1000", probability: "0.15", isTop: false },
    { minis: "3000", probability: "0.04", isTop: false },
    { minis: "10000", probability: "0.01", isTop: true },
  ]);
  const isLocked = disabled || pending;

  const rewardTiersJson = useMemo(() => {
    const normalized = tiers
      .map((tier) => ({
        minis: Number(tier.minis),
        probability: Number(tier.probability),
        isTop: Boolean(tier.isTop),
      }))
      .filter((tier) => Number.isFinite(tier.minis) && Number.isFinite(tier.probability) && tier.minis >= 0 && tier.probability > 0);
    return JSON.stringify(normalized, null, 2);
  }, [tiers]);

  const previewName = productName.trim() || "Product name";
  const previewDescription = productDescription.trim() || "Add a concise description for your listing.";
  const previewPrice =
    productType === "CHALLENGE"
      ? ticketPriceMinis
        ? `${ticketPriceMinis} MINIS`
        : "Ticket price"
      : priceMinis
        ? `${priceMinis} MINIS`
        : "Price";
  const previewMeta =
    productType === "MYSTERY_BOX"
      ? `Guaranteed minimum: ${guaranteedMinMinis || "—"} MINI · Tries: ${totalTries || "—"}`
      : productType === "CHALLENGE"
        ? `Tickets: ${ticketCount || "—"}`
        : "";

  const updateTier = (index: number, key: "minis" | "probability" | "isTop", value: string | boolean) => {
    setTiers((prev) =>
      prev.map((tier, idx) => {
        if (idx !== index) return tier;
        return { ...tier, [key]: value };
      })
    );
  };

  const addTier = () => {
    setTiers((prev) => [...prev, { minis: "", probability: "", isTop: false }]);
  };

  const removeTier = (index: number) => {
    setTiers((prev) => prev.filter((_, idx) => idx !== index));
  };

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
          onChange={(event) => setProductType(event.target.value as "MYSTERY_BOX" | "CHALLENGE" | "STANDARD")}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="MYSTERY_BOX">Mystery box</option>
          <option value="STANDARD">Standard product</option>
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
          value={productName}
          onChange={(event) => setProductName(event.target.value)}
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
          value={productDescription}
          onChange={(event) => setProductDescription(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="productImageUrl">
          Product image
        </label>
        <input
          id="productImageUrl"
          name="imageUrl"
          value={imageUrl}
          disabled={isLocked}
          onChange={(event) => setImageUrl(event.target.value)}
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
            <img src={imageUrl} alt={productName || "Product preview"} className="h-36 w-full object-cover" />
          </div>
        )}
      </div>
      {productType === "MYSTERY_BOX" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="priceMinis">
                Price (MINI)
              </label>
              <input
                id="priceMinis"
                name="priceMinis"
                type="number"
                min={1}
                required
                disabled={isLocked}
                value={priceMinis}
                onChange={(event) => setPriceMinis(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="guaranteedMinMinis">
                Guaranteed minimum MINI
              </label>
              <input
                id="guaranteedMinMinis"
                name="guaranteedMinMinis"
                type="number"
                min={0}
                required
                disabled={isLocked}
                value={guaranteedMinMinis}
                onChange={(event) => setGuaranteedMinMinis(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="totalTries">
                Total tries
              </label>
              <input
                id="totalTries"
                name="totalTries"
                type="number"
                min={1}
                required
                disabled={isLocked}
                value={totalTries}
                onChange={(event) => setTotalTries(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="fundingMinis">
                Funding MINIS
              </label>
              <input
                id="fundingMinis"
                name="fundingMinis"
                type="number"
                min={0}
                required
                disabled={isLocked}
                value={fundingMinis}
                onChange={(event) => setFundingMinis(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Reward tiers</label>
            <p className="mt-1 text-xs text-slate-500">
              Define each tier&apos;s MINI, probability, and whether it&apos;s a top prize. We&apos;ll generate the JSON for you.
            </p>
            <div className="mt-3 space-y-3">
              {tiers.map((tier, idx) => (
                <div key={idx} className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr,1fr,auto]">
                  <input
                    type="number"
                    min={0}
                    placeholder="MINI"
                    value={tier.minis}
                    disabled={isLocked}
                    onChange={(event) => updateTier(idx, "minis", event.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Probability"
                    value={tier.probability}
                    disabled={isLocked}
                    onChange={(event) => updateTier(idx, "probability", event.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={tier.isTop}
                      disabled={isLocked}
                      onChange={(event) => updateTier(idx, "isTop", event.target.checked)}
                    />
                    Top prize
                  </label>
                  {tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTier(idx)}
                      disabled={isLocked}
                      className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTier}
                disabled={isLocked}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                + Add tier
              </button>
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Preview JSON</p>
                <pre className="mt-2 overflow-x-auto text-xs text-slate-700">{rewardTiersJson}</pre>
              </div>
              <input type="hidden" name="rewardTiers" value={rewardTiersJson} readOnly />
            </div>
          </div>
        </>
      ) : productType === "STANDARD" ? (
        <div>
          <label className="text-sm font-medium text-slate-600" htmlFor="priceMinisStandard">
            Price (MINI)
          </label>
          <input
            id="priceMinisStandard"
            name="priceMinis"
            type="number"
            min={1}
            required
            disabled={isLocked}
            value={priceMinis}
            onChange={(event) => setPriceMinis(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="ticketPriceMinis">
              Ticket price (MINI)
            </label>
            <input
              id="ticketPriceMinis"
              name="ticketPriceMinis"
              type="number"
              min={1}
              required
              disabled={isLocked}
              value={ticketPriceMinis}
              onChange={(event) => setTicketPriceMinis(event.target.value)}
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
              value={ticketCount}
              onChange={(event) => setTicketCount(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Preview</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={previewName} className="h-36 w-full object-cover" />
          )}
          <div className="p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="uppercase tracking-[0.3em]">{productType.replace(/_/g, " ")}</span>
              <span className="font-semibold text-slate-600">{previewPrice}</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900">{previewName}</p>
            <p className="mt-1 text-sm text-slate-500">{previewDescription}</p>
            {previewMeta && <p className="mt-2 text-xs text-slate-500">{previewMeta}</p>}
          </div>
        </div>
      </div>
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
