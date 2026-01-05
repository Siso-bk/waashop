"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {product.imageUrl && (
            <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-black/10">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
              />
            </div>
          )}

          {product.description && (
            <div className="rounded-2xl border border-black/10 bg-gray-50 p-4 text-sm text-gray-600">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Details</p>
              <p className="mt-2">{product.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Product</p>
            <h1 className="text-2xl font-semibold text-black">{product.name}</h1>
            {product.vendorName && (
              <p className="text-xs text-gray-500">Vendor: {product.vendorName}</p>
            )}
          </div>

          <div className="rounded-2xl border border-black/10 bg-black px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Price</p>
            <p className="text-2xl font-semibold">{formatMinis(product.priceMinis)}</p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.3em] text-gray-400">Status</span>
              <span className="font-semibold text-black">Available</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.3em] text-gray-400">Checkout</span>
              <span className="font-semibold text-black">Secure wallet flow</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.3em] text-gray-400">Support</span>
              <span className="font-semibold text-black">Waashop help desk</span>
            </div>
          </div>

          {!signedIn ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-gray-50 p-4 text-xs text-gray-600">
              <p>Sign in to add to cart or place an order.</p>
              <Link href="/login" className="mt-2 inline-flex text-xs font-semibold text-black underline">
                Sign in
              </Link>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-gray-700">
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
      </div>
    </div>
  );
}
