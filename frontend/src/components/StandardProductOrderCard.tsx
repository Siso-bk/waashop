"use client";

import Link from "next/link";
import { formatMinis } from "@/lib/minis";
import type { StandardProduct } from "@/types";

export function StandardProductOrderCard({
  product,
  signedIn,
  onAddToCart,
  onOrderNow,
}: {
  product: StandardProduct;
  signedIn: boolean;
  onAddToCart: (product: StandardProduct) => void;
  onOrderNow: (product: StandardProduct) => void;
}) {
  return (
    <article className="flex flex-col rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <Link href={`/products/${product.id}`} className="text-base font-semibold text-black">
          {product.name}
        </Link>
        <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
          {formatMinis(product.priceMinis)}
        </span>
      </div>

      {!signedIn ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-gray-50 p-4 text-xs text-gray-600">
          Sign in to add to cart or place an order.
        </div>
      ) : (
        <div className="mt-6 space-y-3 text-sm text-gray-700">
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="w-full rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
          >
            Add to cart
          </button>
          <button
            type="button"
            onClick={() => onOrderNow(product)}
            className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900"
          >
            Order now
          </button>
        </div>
      )}
    </article>
  );
}
