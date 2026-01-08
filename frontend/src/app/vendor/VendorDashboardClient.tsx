"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { formatMinis } from "@/lib/minis";
import { uploadFileToGcs } from "@/lib/uploads";

const VENDOR_PRODUCTS_ENDPOINT = "/api/vendors/products";
const MAX_IMAGE_BYTES = 500 * 1024;

type VendorProfile = {
  name: string;
  description?: string;
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
};

type RewardTier = {
  minis: number;
  probability: number;
};

type VendorProduct = {
  id: string;
  name: string;
  description?: string;
  type: "STANDARD" | "MYSTERY_BOX" | "CHALLENGE";
  status: "PENDING" | "ACTIVE" | "REJECTED";
  imageUrl?: string;
  imageUrls?: string[];
  priceMinis?: number;
  guaranteedMinMinis?: number;
  rewardTiers?: RewardTier[];
  ticketPriceMinis?: number;
  ticketCount?: number;
  createdAt?: string;
};

type VendorDashboardClientProps = {
  vendor: VendorProfile;
  initialProducts: VendorProduct[];
  canPost: boolean;
};

type FormState = {
  status: "idle" | "submitting" | "success" | "error";
  message?: string;
};

const defaultRewardTiers: RewardTier[] = [
  { minis: 10, probability: 0.7 },
  { minis: 25, probability: 0.25 },
  { minis: 100, probability: 0.05 },
];

export function VendorDashboardClient({ vendor, initialProducts, canPost }: VendorDashboardClientProps) {
  const [activeType, setActiveType] = useState<"STANDARD" | "MYSTERY_BOX" | "CHALLENGE">("STANDARD");
  const [products, setProducts] = useState<VendorProduct[]>(initialProducts);
  const [formState, setFormState] = useState<FormState>({ status: "idle" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [priceMinis, setPriceMinis] = useState("10");
  const [guaranteedMinMinis, setGuaranteedMinMinis] = useState("5");
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>(defaultRewardTiers);
  const [ticketPriceMinis, setTicketPriceMinis] = useState("5");
  const [ticketCount, setTicketCount] = useState("100");

  const statusTone = useMemo(() => {
    if (vendor.status === "APPROVED") return "text-emerald-600";
    if (vendor.status === "PENDING") return "text-amber-600";
    return "text-red-500";
  }, [vendor.status]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setImageUrls([]);
    setImageUrlInput("");
    setImageError(null);
    setPriceMinis("10");
    setGuaranteedMinMinis("5");
    setRewardTiers(defaultRewardTiers);
    setTicketPriceMinis("5");
    setTicketCount("100");
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!canPost) {
      setFormState({ status: "error", message: "Your vendor account must be approved before posting." });
      return;
    }
    if (!name.trim()) {
      setFormState({ status: "error", message: "Enter a name for the listing." });
      return;
    }
    setFormState({ status: "submitting" });

    try {
      const payload: Record<string, unknown> = {
        type: activeType,
        name: name.trim(),
        description: description.trim() || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      };
      if (activeType === "STANDARD") {
        payload.priceMinis = Number(priceMinis);
      }
      if (activeType === "CHALLENGE") {
        payload.ticketPriceMinis = Number(ticketPriceMinis);
        payload.ticketCount = Number(ticketCount);
      }
      if (activeType === "MYSTERY_BOX") {
        payload.priceMinis = Number(priceMinis);
        payload.guaranteedMinMinis = Number(guaranteedMinMinis);
        payload.rewardTiers = rewardTiers.map((tier) => ({
          minis: Number(tier.minis),
          probability: Number(tier.probability),
        }));
        const total = rewardTiers.reduce((sum, tier) => sum + Number(tier.probability || 0), 0);
        if (Math.abs(total - 1) > 0.01) {
          setFormState({ status: "error", message: "Reward probabilities must sum to 1." });
          return;
        }
      }

      const response = await fetch(editingId ? `${VENDOR_PRODUCTS_ENDPOINT}/${editingId}` : VENDOR_PRODUCTS_ENDPOINT, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to save listing.");
      }
      if (data?.product) {
        setProducts((prev) =>
          editingId ? prev.map((item) => (item.id === editingId ? data.product : item)) : [data.product, ...prev]
        );
      }
      setFormState({
        status: "success",
        message: editingId ? "Listing updated." : "Listing submitted for review.",
      });
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save listing.";
      setFormState({ status: "error", message });
    }
  };

  const startEdit = (product: VendorProduct) => {
    setActiveType(product.type);
    setName(product.name);
    setDescription(product.description ?? "");
    setImageUrls(product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []);
    setImageUrlInput("");
    setImageError(null);
    setPriceMinis(String(product.priceMinis ?? 10));
    setGuaranteedMinMinis(String(product.guaranteedMinMinis ?? 0));
    setRewardTiers(product.rewardTiers?.length ? product.rewardTiers : defaultRewardTiers);
    setTicketPriceMinis(String(product.ticketPriceMinis ?? 5));
    setTicketCount(String(product.ticketCount ?? 100));
    setEditingId(product.id);
    setFormState({ status: "idle" });
  };

  const updateTier = (index: number, key: keyof RewardTier, value: string) => {
    setRewardTiers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: Number(value) };
      return next;
    });
  };

  const removeTier = (index: number) => {
    setRewardTiers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addTier = () => {
    setRewardTiers((prev) => [...prev, { minis: 0, probability: 0.05 }]);
  };

  return (
    <div className="space-y-6 pb-20">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-gray-400">Vendor</p>
        <h1 className="mt-2 text-2xl font-semibold text-black">{vendor.name}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Create listings for products, mystery boxes, and challenges.
        </p>
        <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.3em] ${statusTone}`}>
          Status: {vendor.status}
        </p>
        {!canPost && (
          <p className="mt-2 text-sm text-gray-500">
            Posting unlocks after approval. We’ll notify you when your status changes.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {(["STANDARD", "MYSTERY_BOX", "CHALLENGE"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] transition ${
                activeType === type
                  ? "bg-black text-white"
                  : "border border-black/10 text-gray-600 hover:border-black/30"
              }`}
            >
              {type === "STANDARD" ? "Product" : type === "MYSTERY_BOX" ? "Mystery box" : "Challenge"}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 text-sm text-gray-700">
          {editingId && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-700">
              Editing pending listing
            </div>
          )}
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
              placeholder="Listing name"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
              placeholder="What makes this drop special?"
            />
          </label>
          <div className="space-y-2 text-sm text-gray-600">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Product images (optional)</span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-600">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (imageUrls.length >= 6) {
                      setImageError("Add up to 6 images.");
                      event.target.value = "";
                      return;
                    }
                    if (file.size > MAX_IMAGE_BYTES) {
                      setImageError("Image must be under 500KB.");
                      event.target.value = "";
                      return;
                    }
                    try {
                      setImageUploading(true);
                      setImageError(null);
                      const url = await uploadFileToGcs(file, "vendor-products");
                      setImageUrls((current) => [...current, url]);
                    } catch (uploadError) {
                      const message = uploadError instanceof Error ? uploadError.message : "Unable to upload image.";
                      setImageError(message);
                    } finally {
                      setImageUploading(false);
                      event.target.value = "";
                    }
                  }}
                />
                {imageUploading ? "Uploading..." : "Upload image"}
              </label>
              {imageUrls.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrls([]);
                    setImageUrlInput("");
                    setImageError(null);
                  }}
                  className="rounded-full border border-black/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {imageUrls.map((url) => (
                  <div key={url} className="relative h-12 w-12 overflow-hidden rounded-xl border border-black/10 bg-white">
                    <Image src={url} alt="Listing preview" fill sizes="48px" className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => setImageUrls((current) => current.filter((item) => item !== url))}
                      className="absolute -right-1 -top-1 rounded-full bg-black/70 px-1 text-[10px] text-white"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(event) => {
                  setImageUrlInput(event.target.value);
                  setImageError(null);
                }}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
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
                  setImageError(null);
                }}
                className="rounded-full border border-black/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-600"
              >
                Add URL
              </button>
            </div>
            {imageError && <p className="text-xs text-red-500">{imageError}</p>}
          </div>

          {activeType === "STANDARD" && (
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Price (MINIS)</span>
              <input
                value={priceMinis}
                onChange={(event) => setPriceMinis(event.target.value)}
                type="number"
                min={0.01}
                step={0.01}
                className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
              />
            </label>
          )}

          {activeType === "CHALLENGE" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Ticket price (MINIS)</span>
                <input
                  value={ticketPriceMinis}
                  onChange={(event) => setTicketPriceMinis(event.target.value)}
                  type="number"
                  min={1}
                  step={1}
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Ticket count</span>
                <input
                  value={ticketCount}
                  onChange={(event) => setTicketCount(event.target.value)}
                  type="number"
                  min={1}
                  step={1}
                  className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                />
              </label>
            </div>
          )}

          {activeType === "MYSTERY_BOX" && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Price (MINIS)</span>
                  <input
                    value={priceMinis}
                    onChange={(event) => setPriceMinis(event.target.value)}
                    type="number"
                    min={0.01}
                    step={0.01}
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Guaranteed min</span>
                  <input
                    value={guaranteedMinMinis}
                    onChange={(event) => setGuaranteedMinMinis(event.target.value)}
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 text-black"
                  />
                </label>
              </div>
              <div className="space-y-3 rounded-2xl border border-black/10 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Reward tiers</p>
                    <p className="text-xs text-gray-500">Probabilities must sum to 1.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addTier}
                    className="rounded-full border border-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black"
                  >
                    Add tier
                  </button>
                </div>
                <div className="space-y-3">
                  {rewardTiers.map((tier, index) => (
                    <div key={`${tier.minis}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                      <label className="space-y-1 text-xs text-gray-500">
                        Minis
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={tier.minis}
                          onChange={(event) => updateTier(index, "minis", event.target.value)}
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black"
                        />
                      </label>
                      <label className="space-y-1 text-xs text-gray-500">
                        Probability (0-1)
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={tier.probability}
                          onChange={(event) => updateTier(index, "probability", event.target.value)}
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-black"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeTier(index)}
                        className="rounded-full border border-red-200 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {formState.message && (
            <p
              className={`text-sm ${
                formState.status === "success" ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {formState.message}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={formState.status === "submitting"}
            className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {formState.status === "submitting"
              ? editingId
                ? "Saving…"
                : "Submitting…"
              : editingId
              ? "Save changes"
              : "Submit listing"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-black/20 px-6 py-3 text-sm font-semibold text-black transition hover:border-black/40"
            >
              Cancel edit
            </button>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Your listings</p>
            <p className="text-sm text-gray-600">Latest submissions and status.</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {products.length === 0 && <p className="text-sm text-gray-500">No listings yet.</p>}
          {products.map((product, index) => (
            <div key={product.id || `${product.name}-${index}`} className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-black">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.type.replace("_", " ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-black/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
                    {product.status}
                  </span>
                  <button
                    type="button"
                    disabled={product.status !== "PENDING"}
                    onClick={() => startEdit(product)}
                    className="rounded-full border border-black/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black transition hover:border-black/30 disabled:cursor-not-allowed disabled:border-black/5 disabled:text-gray-400"
                  >
                    Edit
                  </button>
                </div>
              </div>
              {product.description && <p className="mt-2 text-xs text-gray-500">{product.description}</p>}
              <div className="mt-3 text-xs text-gray-500">
                {product.type === "STANDARD" && <span>Price: {formatMinis(product.priceMinis || 0)}</span>}
                {product.type === "CHALLENGE" && (
                  <span>
                    Ticket: {formatMinis(product.ticketPriceMinis || 0)} · Count: {product.ticketCount}
                  </span>
                )}
                {product.type === "MYSTERY_BOX" && (
                  <span>
                    Price: {formatMinis(product.priceMinis || 0)} · Guaranteed:{" "}
                    {formatMinis(product.guaranteedMinMinis || 0)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
