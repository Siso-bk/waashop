"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { StandardProduct } from "@/types";
import { addToCart, setCartItems } from "@/lib/cart";
import { formatMinis } from "@/lib/minis";

export function ProductDetailClient({
  product,
  signedIn,
}: {
  product: StandardProduct;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  const handleAddToCart = () => {
    addToCart(product);
    setMessage("Added to cart.");
    setTimeout(() => setMessage(null), 1200);
  };

  const handleOrderNow = () => {
    setCartItems([{ product, quantity: 1 }]);
    router.push("/cart?checkout=1");
  };

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.name}
          className="mb-6 h-56 w-full rounded-2xl border border-black/10 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="mb-6 flex h-56 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/15 bg-gray-50">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-10 w-10 text-gray-400">
            <path
              fill="currentColor"
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9A2.5 2.5 0 0 1 17.5 17h-11A2.5 2.5 0 0 1 4 14.5v-9Zm2.5-.5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V9l-3.2 3.2a1 1 0 0 1-1.3.1L10 11l-4 4V5.5a.5.5 0 0 0-.5-.5Z"
            />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            No image
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Standard product</p>
          <h1 className="mt-2 text-2xl font-semibold text-black">{product.name}</h1>
          {product.vendorName && (
            <p className="mt-1 text-xs text-gray-500">Vendor: {product.vendorName}</p>
          )}
        </div>
        <div className="rounded-2xl border border-black/10 bg-black px-5 py-3 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Price</p>
          <p className="text-xl font-semibold">{formatMinis(product.priceMinis)}</p>
        </div>
      </div>

      {product.description && <p className="mt-4 text-sm text-gray-600">{product.description}</p>}

      {!signedIn ? (
        <div className="mt-6 rounded-2xl border border-dashed border-black/15 bg-gray-50 p-4 text-xs text-gray-600">
          <p>Sign in to add to cart or place an order.</p>
          <Link href="/login" className="mt-2 inline-flex text-xs font-semibold text-black underline">
            Sign in
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3 text-sm text-gray-700">
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
          >
            Add to cart
          </button>
          <button
            type="button"
            onClick={handleOrderNow}
            className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900"
          >
            Order now
          </button>
          {message && <p className="text-xs text-emerald-600">{message}</p>}
        </div>
      )}
    </div>
  );
}
