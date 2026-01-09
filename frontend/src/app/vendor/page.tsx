import Link from "next/link";
import { getSessionUser } from "@/lib/queries";
import { backendFetch } from "@/lib/backendClient";
import { VendorDashboardClient } from "./VendorDashboardClient";

type VendorProfile = {
  name: string;
  description?: string;
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
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
  rewardTiers?: Array<{ minis: number; probability: number }>;
  ticketPriceMinis?: number;
  ticketCount?: number;
  createdAt?: string;
};

type VendorOrder = {
  id: string;
  productId: string;
  productType?: string;
  status:
    | "PLACED"
    | "PACKED"
    | "SHIPPED"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "COMPLETED"
    | "DISPUTED"
    | "REFUNDED"
    | "CANCELLED"
    | "REJECTED"
    | "DAMAGED"
    | "UNSUCCESSFUL";
  amountMinis: number;
  quantity: number;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  trackingCode?: string;
  createdAt?: string;
};

export default async function VendorIndexPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-600">Sign in to access vendor tools.</p>
        <p className="text-xs text-gray-500">Use your email or username@pai.</p>
        <Link
          href="/login?redirect=/vendor"
          className="inline-flex rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  let vendor: VendorProfile | null = null;
  try {
    const data = await backendFetch<{ vendor: VendorProfile }>("/api/vendors/me");
    vendor = data.vendor;
  } catch {
    vendor = null;
  }

  if (!vendor) {
    return (
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">No vendor profile found yet.</p>
        <Link
          href="/vendor/apply"
          className="inline-flex rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Start vendor application
        </Link>
      </div>
    );
  }

  let products: VendorProduct[] = [];
  try {
    const data = await backendFetch<{ products: VendorProduct[] }>("/api/vendors/products");
    products = data.products || [];
  } catch {
    products = [];
  }

  let orders: VendorOrder[] = [];
  try {
    const data = await backendFetch<{ orders: VendorOrder[] }>("/api/vendors/orders");
    orders = data.orders || [];
  } catch {
    orders = [];
  }

  return (
    <VendorDashboardClient
      vendor={vendor}
      initialProducts={products}
      initialOrders={orders}
      canPost={vendor.status === "APPROVED"}
    />
  );
}
