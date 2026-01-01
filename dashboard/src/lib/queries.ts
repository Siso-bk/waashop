import { backendFetch } from "@/lib/backendClient";
import { ProductDto, ProfileResponse, VendorProfile, HomeHeroContent } from "@/types";

export const getProfile = async (): Promise<ProfileResponse> => {
  return backendFetch<ProfileResponse>("/api/me");
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
