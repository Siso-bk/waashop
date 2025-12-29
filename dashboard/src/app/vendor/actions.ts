"use server";

import { revalidatePath } from "next/cache";
import { backendFetch } from "@/lib/backendClient";

interface ActionState {
  error?: string;
}

export const submitVendorProfileAction = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  const name = formData.get("name");
  const description = formData.get("description");
  if (!name || typeof name !== "string") {
    return { error: "Vendor name is required" };
  }
  try {
    await backendFetch("/api/vendors", {
      method: "POST",
      body: JSON.stringify({ name, description: typeof description === "string" ? description : undefined }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit vendor profile";
    return { error: message };
  }
  revalidatePath("/vendor");
  return {};
};

export const createVendorProductAction = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  const name = formData.get("productName");
  const description = formData.get("productDescription");
  const priceCoins = Number(formData.get("priceCoins"));
  const guaranteedMinPoints = Number(formData.get("guaranteedMinPoints"));
  const tiersRaw = formData.get("rewardTiers");

  if (!name || typeof name !== "string") {
    return { error: "Product name is required" };
  }
  if (!Number.isFinite(priceCoins) || priceCoins <= 0) {
    return { error: "Price must be a positive number" };
  }
  if (!Number.isFinite(guaranteedMinPoints) || guaranteedMinPoints <= 0) {
    return { error: "Guaranteed minimum must be a positive number" };
  }
  if (!tiersRaw || typeof tiersRaw !== "string") {
    return { error: "Reward tiers JSON is required" };
  }

  let rewardTiers: unknown;
  try {
    rewardTiers = JSON.parse(tiersRaw);
  } catch {
    return { error: "Reward tiers must be valid JSON" };
  }

  if (!Array.isArray(rewardTiers)) {
    return { error: "Reward tiers JSON must be an array" };
  }

  const tiers = rewardTiers.map((tier) => ({
    points: Number(tier.points),
    probability: Number(tier.probability),
    isTop: Boolean(tier.isTop),
  }));

  if (tiers.some((tier) => !Number.isFinite(tier.points) || !Number.isFinite(tier.probability))) {
    return { error: "Each tier requires numeric points/probability" };
  }
  const probabilitySum = tiers.reduce((acc, tier) => acc + tier.probability, 0);
  if (Math.abs(probabilitySum - 1) > 0.01) {
    return { error: "Tier probabilities must sum to 1" };
  }

  try {
    await backendFetch("/api/vendors/products", {
      method: "POST",
      body: JSON.stringify({
        name,
        description: typeof description === "string" ? description : undefined,
        priceCoins,
        guaranteedMinPoints,
        rewardTiers: tiers,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return { error: message };
  }

  revalidatePath("/vendor");
  return {};
};
