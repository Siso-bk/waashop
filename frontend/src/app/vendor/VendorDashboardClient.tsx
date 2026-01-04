"use client";

import { useMemo, useState } from "react";
import { formatMinis } from "@/lib/minis";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
    setPriceMinis("10");
    setGuaranteedMinMinis("5");
    setRewardTiers(defaultRewardTiers);
    setTicketPriceMinis("5");
    setTicketCount("100");
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

      const response = await fetch(`${API_BASE_URL}/api/vendors/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Unable to create listing.");
      }
      if (data?.product) {
        setProducts((prev) => [data.product, ...prev]);
      }
      setFormState({ status: "success", message: "Listing submitted for review." });
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create listing.";
      setFormState({ status: "error", message });
    }
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
            {formState.status === "submitting" ? "Submitting…" : "Submit listing"}
          </button>
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
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-black">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.type.replace("_", " ")}</p>
                </div>
                <span className="rounded-full border border-black/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-gray-500">
                  {product.status}
                </span>
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
