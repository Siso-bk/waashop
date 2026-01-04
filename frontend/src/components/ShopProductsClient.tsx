"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StandardProduct } from "@/types";
import { StandardProductOrderCard } from "@/components/StandardProductOrderCard";
import { formatMinis } from "@/lib/minis";
import Link from "next/link";
import { addToCart, setCartItems, useCart } from "@/lib/cart";

type ShopProductsClientProps = {
  products: StandardProduct[];
  signedIn: boolean;
};
export function ShopProductsClient({ products, signedIn }: ShopProductsClientProps) {
  const router = useRouter();
  const cart = useCart();
  const [message, setMessage] = useState<string | null>(null);

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + (item.product.priceMinis || 0) * item.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleAddToCart = (product: StandardProduct) => {
    addToCart(product);
    setMessage(`${product.name} added to cart.`);
    setTimeout(() => setMessage(null), 1200);
  };

  const orderNow = (product: StandardProduct) => {
    setCartItems([{ product, quantity: 1 }]);
    router.push("/cart?checkout=1");
  };

  if (!signedIn) {
    return (
      <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
        Sign in to add products to your cart.
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="grid gap-4 grid-cols-2">
        {products.map((product) => (
          <StandardProductOrderCard
            key={product.id}
            product={product}
            signedIn={signedIn}
            onAddToCart={handleAddToCart}
            onOrderNow={orderNow}
          />
        ))}
        {products.length === 0 && (
          <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
            No products available right now. Check back soon.
          </div>
        )}
      </div>

      <section className="fixed bottom-24 left-1/2 z-30 w-[min(640px,92%)] -translate-x-1/2 rounded-3xl border border-black/10 bg-white/95 p-5 shadow-xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Cart</p>
            <p className="text-sm text-gray-600">
              {cart.length ? `${cart.length} item(s) · ${formatMinis(cartTotal)}` : "Your cart is empty."}
            </p>
          </div>
          <Link
            href="/cart"
            className="group inline-flex items-center gap-2 rounded-full bg-black px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900"
          >
            <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4 text-white"
              >
                <path
                  fill="currentColor"
                  d="M7.5 18a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3Zm9 0a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-3ZM6.2 6h14.3a1 1 0 0 1 .98 1.2l-1.2 6a1 1 0 0 1-.98.8H8.1a1 1 0 0 1-.98-.8L5.9 6.5L5.2 3H3a1 1 0 1 1 0-2h2a1 1 0 0 1 .98.8L6.2 6Z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-400 px-1 text-[9px] font-semibold text-black">
                  {cartCount}
                </span>
              )}
            </span>
            <span>View cart</span>
          </Link>
        </div>
        {message && <p className="mt-3 text-xs text-emerald-600">{message}</p>}
      </section>
    </div>
  );
}
