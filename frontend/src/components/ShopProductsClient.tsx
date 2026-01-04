"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { StandardProduct } from "@/types";
import { StandardProductOrderCard } from "@/components/StandardProductOrderCard";
import { formatMinis } from "@/lib/minis";
import Link from "next/link";

type CartItem = {
  product: StandardProduct;
  quantity: number;
};

type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: ActionState = { status: "idle" };

type ShopProductsClientProps = {
  products: StandardProduct[];
  signedIn: boolean;
  createCartOrders: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
};

function SubmitCheckoutButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Processing..." : "Place order"}
    </button>
  );
}

export function ShopProductsClient({ products, signedIn, createCartOrders }: ShopProductsClientProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [state, action] = useFormState(createCartOrders, initialState);

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + (item.product.priceMinis || 0) * item.quantity, 0),
    [cart]
  );

  const checkoutTotal = useMemo(
    () =>
      checkoutItems.reduce(
        (sum, item) => sum + (item.product.priceMinis || 0) * item.quantity,
        0
      ),
    [checkoutItems]
  );

  const itemsPayload = useMemo(
    () =>
      JSON.stringify(
        checkoutItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        }))
      ),
    [checkoutItems]
  );

  useEffect(() => {
    if (state.status === "success") {
      setCart([]);
      const timer = setTimeout(() => setCheckoutOpen(false), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state.status]);

  const addToCart = (product: StandardProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const openCheckout = (items: CartItem[]) => {
    setCheckoutItems(items);
    setCheckoutOpen(true);
  };

  const orderNow = (product: StandardProduct) => {
    openCheckout([{ product, quantity: 1 }]);
  };

  if (!signedIn) {
    return (
      <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
        Sign in to add products to your cart.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Cart</p>
            <p className="text-sm text-gray-600">
              {cart.length ? `${cart.length} item(s) · ${formatMinis(cartTotal)}` : "Your cart is empty."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openCheckout(cart)}
              disabled={cart.length === 0}
              className="rounded-full bg-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Checkout
            </button>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="rounded-full border border-black/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-black"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        {cart.length > 0 && (
          <div className="mt-4 space-y-3 text-xs text-gray-600">
            {cart.map((item) => (
              <div key={item.product.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-black">{item.product.name}</p>
                  <p className="text-gray-500">{formatMinis(item.product.priceMinis)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="h-7 w-7 rounded-full border border-black/10 text-xs font-semibold text-black"
                  >
                    -
                  </button>
                  <span className="min-w-[24px] text-center text-xs font-semibold text-black">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="h-7 w-7 rounded-full border border-black/10 text-xs font-semibold text-black"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id)}
                    className="rounded-full border border-red-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex gap-6 overflow-x-auto pb-3">
        {products.map((product) => (
          <StandardProductOrderCard
            key={product.id}
            product={product}
            signedIn={signedIn}
            onAddToCart={addToCart}
            onOrderNow={orderNow}
          />
        ))}
        {products.length === 0 && (
          <div className="rounded-3xl border border-dashed border-black/20 bg-white p-8 text-center text-sm text-gray-500">
            No products available right now. Check back soon.
          </div>
        )}
      </div>

      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-black/10 px-6 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Checkout</p>
                <h2 className="mt-2 text-lg font-semibold text-black">Buyer information</h2>
                <p className="mt-1 text-xs text-gray-500">Total: {formatMinis(checkoutTotal)}</p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/15 text-black transition hover:bg-black hover:text-white"
              >
                ×
              </button>
            </div>
            <form action={action} className="space-y-4 px-6 pb-8 pt-6 text-sm text-gray-700">
              <input type="hidden" name="items" value={itemsPayload} />
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Full name</span>
                <input
                  name="shippingName"
                  placeholder="Full name"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Phone</span>
                <input
                  name="shippingPhone"
                  placeholder="Phone number"
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Shipping address</span>
                <textarea
                  name="shippingAddress"
                  placeholder="Shipping address"
                  rows={2}
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Notes</span>
                <textarea
                  name="notes"
                  placeholder="Order notes (optional)"
                  rows={2}
                  className="w-full rounded-xl border border-black/10 px-3 py-2"
                />
              </label>
              <div className="rounded-2xl border border-black/10 bg-gray-50 p-4 text-xs text-gray-600">
                {checkoutItems.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between py-1">
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>{formatMinis(item.product.priceMinis * item.quantity)}</span>
                  </div>
                ))}
              </div>
              {state.status !== "idle" && (
                <p
                  className={`text-sm ${
                    state.status === "success" ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {state.message}
                </p>
              )}
              <SubmitCheckoutButton disabled={!checkoutItems.length} />
              {state.status === "success" && (
                <Link
                  href="/orders"
                  className="inline-flex w-full items-center justify-center rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black"
                >
                  View orders
                </Link>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
