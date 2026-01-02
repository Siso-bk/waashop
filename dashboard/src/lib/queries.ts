import { backendFetch } from "@/lib/backendClient";
import {
  ProductDto,
  ProfileResponse,
  VendorProfile,
  HomeHeroContent,
  HomeHighlightCard,
  PromoCardDto,
  AdminUser,
  PlatformSettingsDto,
  DepositRequestDto,
  WithdrawalRequestDto,
  NotificationDto,
} from "@/types";

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

export const getVendorPromoCards = async () => {
  return backendFetch<{ promoCards: PromoCardDto[] }>("/api/vendors/promo-cards");
};

export const getAdminUsers = async () => {
  return backendFetch<{ users: AdminUser[] }>("/api/admin/users");
};

export const getAdminSettings = async () => {
  return backendFetch<{ settings: PlatformSettingsDto }>("/api/admin/settings");
};

export const getUserDeposits = async () => {
  return backendFetch<{ deposits: DepositRequestDto[] }>("/api/deposits");
};

export const getAdminDeposits = async (status?: string) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return backendFetch<{ deposits: DepositRequestDto[] }>(`/api/admin/deposits${query}`);
};

export const getUserWithdrawals = async () => {
  return backendFetch<{ withdrawals: WithdrawalRequestDto[] }>("/api/withdrawals");
};

export const getAdminWithdrawals = async (status?: string) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return backendFetch<{ withdrawals: WithdrawalRequestDto[] }>(`/api/admin/withdrawals${query}`);
};

export const getNotifications = async () => {
  return backendFetch<{ notifications: NotificationDto[] }>("/api/notifications");
};

export const getNotificationsSummary = async () => {
  return backendFetch<{ unread: number }>("/api/notifications/unread-count");
};
