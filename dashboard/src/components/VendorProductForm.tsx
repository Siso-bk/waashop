"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createVendorProductAction } from "@/app/vendor/actions";
import { PendingButton } from "@/components/PendingButton";
import { uploadFileToGcs } from "@/lib/uploads";

const initialState = { error: "" };

export function VendorProductForm({ disabled }: { disabled?: boolean }) {
  const [state, action] = useActionState(createVendorProductAction, initialState);
  const { pending } = useFormStatus();
  const [productType, setProductType] = useState<"MYSTERY_BOX" | "CHALLENGE" | "STANDARD" | "JACKPOT_PLAY">("MYSTERY_BOX");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageError, setImageError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [priceMinis, setPriceMinis] = useState("");
  const [guaranteedMinMinis, setGuaranteedMinMinis] = useState("");
  const [totalTries, setTotalTries] = useState("");
  const [fundingMinis, setFundingMinis] = useState("");
  const [ticketPriceMinis, setTicketPriceMinis] = useState("");
  const [ticketCount, setTicketCount] = useState("");
  const [jackpotWinOdds, setJackpotWinOdds] = useState("0.02");
  const [submitCount, setSubmitCount] = useState(0);
  const [noticeHidden, setNoticeHidden] = useState(false);
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
      : productType === "JACKPOT_PLAY"
        ? priceMinis
          ? `${priceMinis} MINIS`
          : "Try price"
        : priceMinis
          ? `${priceMinis} MINIS`
          : "Price";
  const previewMeta =
    productType === "MYSTERY_BOX"
      ? `Guaranteed minimum: ${guaranteedMinMinis || "—"} MINI · Tries: ${totalTries || "—"}`
      : productType === "CHALLENGE"
        ? `Tickets: ${ticketCount || "—"}`
        : productType === "JACKPOT_PLAY"
          ? `Win odds: ${jackpotWinOdds ? `${(Number(jackpotWinOdds) * 100).toFixed(2)}%` : "—"}`
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

  const normalizeTiers = () => {
    const numeric = tiers.map((tier) => Number(tier.probability));
    const total = numeric.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
    if (!Number.isFinite(total) || total <= 0) {
      window.alert("Add tier probabilities before normalizing.");
      return;
    }
    const normalized = numeric.map((value) => (Number.isFinite(value) ? value / total : 0));
    if (normalized.length === 0) return;
    const lastIndex = normalized.length - 1;
    const rounded = normalized.map((value, index) => (index === lastIndex ? value : Number(value.toFixed(4))));
    const sumRounded = rounded.slice(0, lastIndex).reduce((sum, value) => sum + value, 0);
    const lastValue = Math.max(0, 1 - sumRounded);
    const finalValues = rounded.map((value, index) => (index === lastIndex ? lastValue : value));
    setTiers((prev) =>
      prev.map((tier, index) => ({
        ...tier,
        probability: finalValues[index]?.toFixed(4) ?? tier.probability,
      }))
    );
  };

  const showSuccess = submitCount > 0 && !pending && !state.error && !noticeHidden;
  const showError = Boolean(state.error) && !noticeHidden;

  return (
    <form
      action={action}
      onSubmit={() => {
        setSubmitCount((count) => count + 1);
        setNoticeHidden(false);
      }}
      className="space-y-4"
    >
      <div>
        <label className="text-sm font-medium text-slate-600" htmlFor="productType">
          Product type
        </label>
        <select
          id="productType"
          name="type"
          value={productType}
          disabled={isLocked}
          onChange={(event) =>
            setProductType(event.target.value as "MYSTERY_BOX" | "CHALLENGE" | "STANDARD" | "JACKPOT_PLAY")
          }
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="MYSTERY_BOX">Mystery box</option>
          <option value="JACKPOT_PLAY">Jackpot play</option>
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
          Product images
        </label>
        <input type="hidden" name="imageUrls" value={JSON.stringify(imageUrls)} />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            {isUploading ? "Uploading..." : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isLocked}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (imageUrls.length >= 6) {
                  setImageError("Add up to 6 images.");
                  event.target.value = "";
                  return;
                }
                if (file.size > 1024 * 1024) {
                  setImageError("Please use an image under 1MB.");
                  event.target.value = "";
                  return;
                }
                try {
                  setIsUploading(true);
                  setImageError("");
                  const url = await uploadFileToGcs(file, "vendor-products");
                  setImageUrls((current) => [...current, url]);
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Unable to upload image.";
                  setImageError(message);
                } finally {
                  setIsUploading(false);
                  event.target.value = "";
                }
              }}
            />
          </label>
          {imageUrls.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setImageUrls([]);
                setImageUrlInput("");
                setImageError("");
              }}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
            >
              Clear
            </button>
          )}
          <span>Uploads store in your Waashop bucket.</span>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="productImageUrl"
            value={imageUrlInput}
            disabled={isLocked}
            onChange={(event) => {
              setImageUrlInput(event.target.value);
              setImageError("");
            }}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Paste image URL"
          />
          <button
            type="button"
            onClick={() => {
              const value = imageUrlInput.trim();
              if (!value) return;
              if (imageUrls.length >= 6) {
                setImageError("Add up to 6 images.");
                return;
              }
              if (imageUrls.includes(value)) {
                setImageError("Image already added.");
                return;
              }
              setImageUrls((current) => [...current, value]);
              setImageUrlInput("");
              setImageError("");
            }}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
          >
            Add URL
          </button>
        </div>
        {imageError && <p className="mt-2 text-xs text-red-500">{imageError}</p>}
        {imageUrls.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {imageUrls.map((url) => (
              <div key={url} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={productName || "Product preview"} className="h-36 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrls((current) => current.filter((item) => item !== url))}
                  className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white opacity-0 transition group-hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}
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
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={addTier}
                  disabled={isLocked}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                >
                  + Add tier
                </button>
                <button
                  type="button"
                  onClick={normalizeTiers}
                  disabled={isLocked}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-50"
                >
                  Auto-normalize
                </button>
              </div>
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Preview JSON</p>
                <pre className="mt-2 overflow-x-auto text-xs text-slate-700">{rewardTiersJson}</pre>
              </div>
              <input type="hidden" name="rewardTiers" value={rewardTiersJson} readOnly />
            </div>
          </div>
        </>
      ) : productType === "JACKPOT_PLAY" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="priceMinisJackpot">
              Try price (MINI)
            </label>
            <input
              id="priceMinisJackpot"
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
            <label className="text-sm font-medium text-slate-600" htmlFor="winOdds">
              Win odds (0-1)
            </label>
            <input
              id="winOdds"
              name="winOdds"
              type="number"
              min={0.001}
              max={1}
              step={0.001}
              required
              disabled={isLocked}
              value={jackpotWinOdds}
              onChange={(event) => setJackpotWinOdds(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500">Example: 0.02 = 2% chance per try.</p>
          </div>
        </div>
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
          {imageUrls[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrls[0]} alt={previewName} className="h-36 w-full object-cover" />
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
      {showSuccess && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <div>
            <p className="font-semibold">Product submitted</p>
            <p className="text-xs text-emerald-700/80">We&apos;re reviewing your listing. You&apos;ll see updates here.</p>
          </div>
          <button
            type="button"
            onClick={() => setNoticeHidden(true)}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700/70 hover:text-emerald-700"
          >
            Dismiss
          </button>
        </div>
      )}
      {showError && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div>
            <p className="font-semibold">Submission failed</p>
            <p className="text-xs text-rose-700/80">{state.error}</p>
          </div>
          <button
            type="button"
            onClick={() => setNoticeHidden(true)}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700/70 hover:text-rose-700"
          >
            Dismiss
          </button>
        </div>
      )}
      <PendingButton
        pendingLabel="Submitting..."
        disabled={isLocked}
        className="rounded-xl border border-indigo-300 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-300"
      >
        Submit product
      </PendingButton>
    </form>
  );
}
