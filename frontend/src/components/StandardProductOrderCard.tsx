"use client";

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
    <article className="flex min-w-[280px] flex-col rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      {product.imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="mb-4 h-36 w-full rounded-2xl border border-black/10 object-cover"
            loading="lazy"
          />
        </>
      ) : (
        <div className="mb-4 flex h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-gray-50">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8 text-gray-400">
            <path
              fill="currentColor"
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9A2.5 2.5 0 0 1 17.5 17h-11A2.5 2.5 0 0 1 4 14.5v-9Zm2.5-.5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V9l-3.2 3.2a1 1 0 0 1-1.3.1L10 11l-4 4V5.5a.5.5 0 0 0-.5-.5Z"
            />
          </svg>
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-400">
            No image
          </span>
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>STANDARD PRODUCT</span>
        <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
          {formatMinis(product.priceMinis)}
        </span>
      </div>
      <h3 className="mt-3 text-xl font-semibold text-black">{product.name}</h3>
      {product.vendorName && <p className="mt-1 text-xs text-gray-500">Vendor: {product.vendorName}</p>}
      {product.description && <p className="mt-3 text-sm text-gray-600">{product.description}</p>}

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
