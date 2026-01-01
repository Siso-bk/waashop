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
  const payload = extractProductPayload(formData);
  if (payload.error) {
    return { error: payload.error };
  }

  try {
    await backendFetch("/api/vendors/products", {
      method: "POST",
      body: JSON.stringify(payload.data),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return { error: message };
  }

  revalidatePath("/vendor");
  return {};
};

export const updateVendorProductAction = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  const productId = formData.get("productId");
  if (!productId || typeof productId !== "string") {
    return { error: "Missing product id" };
  }
  const payload = extractProductPayload(formData);
  if (payload.error) {
    return { error: payload.error };
  }
  try {
    await backendFetch(`/api/vendors/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(payload.data),
    });
    revalidatePath("/vendor");
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return { error: message };
  }
};

export const deleteVendorProductAction = async (
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> => {
  const productId = formData.get("productId");
  if (!productId || typeof productId !== "string") {
    return { error: "Missing product id" };
  }
  try {
    await backendFetch(`/api/vendors/products/${productId}`, {
      method: "DELETE",
    });
    revalidatePath("/vendor");
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return { error: message };
  }
};

const extractProductPayload = (formData: FormData): { data?: unknown; error?: string } => {
  const name = formData.get("productName");
  const description = formData.get("productDescription");
  const type = (formData.get("productType") || formData.get("type") || "MYSTERY_BOX") as string;

  if (!name || typeof name !== "string") {
    return { error: "Product name is required" };
  }

  if (type === "CHALLENGE") {
    const ticketPriceCoins = Number(formData.get("ticketPriceCoins"));
    const ticketCount = Number(formData.get("ticketCount"));
    if (!Number.isFinite(ticketPriceCoins) || ticketPriceCoins <= 0) {
      return { error: "Ticket price must be positive" };
    }
    if (!Number.isFinite(ticketCount) || ticketCount <= 0) {
      return { error: "Ticket count must be positive" };
    }
    return {
      data: {
        type: "CHALLENGE",
        name,
        description: typeof description === "string" ? description : undefined,
        ticketPriceCoins,
        ticketCount,
      },
    };
  }

  const priceCoins = Number(formData.get("priceCoins"));
  const guaranteedMinPoints = Number(formData.get("guaranteedMinPoints"));
  const tiersRaw = formData.get("rewardTiers");
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
  if (!tiers.some((tier) => tier.isTop)) {
    return { error: "Mark at least one reward tier as a top winner (set isTop: true)." };
  }

  return {
    data: {
      type: "MYSTERY_BOX",
      name,
      description: typeof description === "string" ? description : undefined,
      priceCoins,
      guaranteedMinPoints,
      rewardTiers: tiers,
    },
  };
};

export const createPromoCardAction = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  const title = formData.get("promoTitle");
  const description = formData.get("promoDescription");
  const ctaLabel = formData.get("promoCtaLabel");
  const ctaHref = formData.get("promoCtaHref");
  const imageUrl = formData.get("promoImageUrl");

  if (!title || typeof title !== "string" || title.trim().length < 5) {
    return { error: "Promo title must be at least 5 characters." };
  }

  try {
    await backendFetch("/api/vendors/promo-cards", {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        description: typeof description === "string" ? description : undefined,
        ctaLabel: typeof ctaLabel === "string" ? ctaLabel : undefined,
        ctaHref: typeof ctaHref === "string" ? ctaHref : undefined,
        imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : undefined,
      }),
    });
    revalidatePath("/vendor");
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit promo card";
    return { error: message };
  }
};

export const updatePromoCardAction = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  const cardId = formData.get("promoId");
  if (!cardId || typeof cardId !== "string") {
    return { error: "Missing promo id" };
  }
  const payload = extractPromoPayload(formData);
  if (payload.error) {
    return { error: payload.error };
  }
  try {
    await backendFetch(`/api/vendors/promo-cards/${cardId}`, {
      method: "PATCH",
      body: JSON.stringify(payload.data),
    });
    revalidatePath("/vendor");
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update promo card";
    return { error: message };
  }
};

export const deletePromoCardAction = async (_prev: ActionState, formData: FormData): Promise<ActionState> => {
  const cardId = formData.get("promoId");
  if (!cardId || typeof cardId !== "string") {
    return { error: "Missing promo id" };
  }
  try {
    await backendFetch(`/api/vendors/promo-cards/${cardId}`, {
      method: "DELETE",
    });
    revalidatePath("/vendor");
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete promo card";
    return { error: message };
  }
};

const extractPromoPayload = (formData: FormData): { data?: unknown; error?: string } => {
  const title = formData.get("promoTitle");
  const description = formData.get("promoDescription");
  const ctaLabel = formData.get("promoCtaLabel");
  const ctaHref = formData.get("promoCtaHref");
  const imageUrl = formData.get("promoImageUrl");

  if (!title || typeof title !== "string" || title.trim().length < 5) {
    return { error: "Promo title must be at least 5 characters." };
  }

  return {
    data: {
      title: title.trim(),
      description: typeof description === "string" ? description : undefined,
      ctaLabel: typeof ctaLabel === "string" ? ctaLabel : undefined,
      ctaHref: typeof ctaHref === "string" ? ctaHref : undefined,
      imageUrl: typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : undefined,
    },
  };
};
