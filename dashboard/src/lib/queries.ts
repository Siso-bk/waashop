import { backendFetch } from "@/lib/backendClient";
import { ProductDto, ProfileResponse, VendorProfile, HomeHeroContent, HomeHighlightCard } from "@/types";

export const getProfile = async (): Promise<ProfileResponse> => {
  return backendFetch<ProfileResponse>("/api/me");
};

export const getOptionalProfile = async (): Promise<ProfileResponse | null> => {
  try {
    return await backendFetch<ProfileResponse>("/api/me");
  } catch {
    return null;
  }
};

export const getAdminVendors = async (status?: string) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return backendFetch<{ vendors: VendorProfile[] }>(`/api/admin/vendors${query}`);
};

export const getAdminProducts = async () => {
  return backendFetch<{ products: ProductDto[] }>("/api/admin/products");
};

export const getVendorProducts = async () => {
  return backendFetch<{ products: ProductDto[] }>("/api/vendors/products");
};

export const getAdminHomeHero = async () => {
  return backendFetch<{ hero: HomeHeroContent }>("/api/admin/home-hero");
};

export const getAdminHomeHighlights = async () => {
  return backendFetch<{ cards: HomeHighlightCard[] }>("/api/admin/home-highlights");
};
