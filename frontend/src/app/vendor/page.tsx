import Link from "next/link";
import { getSessionUser } from "@/lib/queries";
import type { VendorOrder, VendorProduct } from "@/types";
import { backendFetch } from "@/lib/backendClient";
import { VendorDashboardClient } from "./VendorDashboardClient";

type VendorProfile = {
  name: string;
  description?: string;
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";
};

export default async function VendorIndexPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 text-center shadow-sm">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-black"
        >
          <span aria-hidden>←</span>
          Account
        </Link>
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
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-black"
        >
          <span aria-hidden>←</span>
          Account
        </Link>
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
    <div className="space-y-6 pb-20">
      <Link
        href="/account"
        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-black"
      >
        <span aria-hidden>←</span>
        Account
      </Link>
      <VendorDashboardClient
        vendor={vendor}
        initialProducts={products}
        initialOrders={orders}
        canPost={vendor.status === "APPROVED"}
      />
    </div>
  );
}
