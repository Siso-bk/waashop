"use client";

import { useEffect, useState } from "react";
import type { StandardProduct } from "@/types";
import { ProductDetailClient } from "@/components/ProductDetailClient";

type Props = {
  productId: string;
  signedIn: boolean;
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; product: StandardProduct };

const mapProduct = (product: any): StandardProduct => ({
  id:
    (typeof product.id === "string" && product.id) ||
    (typeof product._id === "string" && product._id) ||
    product._id?.toString?.() ||
    "",
  name: product.name,
  description: product.description,
  priceMinis: product.priceMinis ?? 0,
  vendorName: product.vendorName,
  vendorPhone: product.vendorPhone,
  vendorCity: product.vendorCity,
  vendorAddress: product.vendorAddress,
  imageUrl: product.imageUrl,
  imageUrls: product.imageUrls,
});

export function ProductDetailLoader({ productId, signedIn }: Props) {
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`, { cache: "no-store" });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const message = typeof data.error === "string" ? data.error : "Product not found";
          if (active) setState({ status: "error", message });
          return;
        }
        const data = await response.json();
        if (!data.product) {
          if (active) setState({ status: "error", message: "Product not found" });
          return;
        }
        if (data.product.type && data.product.type !== "STANDARD") {
          if (active) setState({ status: "error", message: "Product not available" });
          return;
        }
        if (active) setState({ status: "ready", product: mapProduct(data.product) });
      } catch {
        if (active) setState({ status: "error", message: "Unable to load product." });
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [productId]);

  if (state.status === "ready") {
    return <ProductDetailClient product={state.product} signedIn={signedIn} />;
  }

  if (state.status === "error") {
    return (
      <div className="web-panel p-8 text-center text-sm text-[color:var(--app-text-muted)]">
        {state.message}
      </div>
    );
  }

  return (
    <div className="web-panel p-8 text-center text-sm text-[color:var(--app-text-muted)]">
      Loading product...
    </div>
  );
}
