"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { formatMinis } from "@/lib/minis";
import {
  clearCart,
  removeFromCart,
  updateCartQuantity,
  useCart,
  type CartItem,
} from "@/lib/cart";

type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: ActionState = { status: "idle" };

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

export function CartClient({
  initialCheckout,
  createCartOrders,
}: {
  initialCheckout: boolean;
  createCartOrders: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const cart = useCart();
  const shouldAutoOpen = initialCheckout && cart.length > 0;
  const [checkoutOpen, setCheckoutOpen] = useState(shouldAutoOpen);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>(
    shouldAutoOpen ? cart : []
  );
  const [state, action] = useActionState(async (prevState: ActionState, formData: FormData) => {
    const next = await createCartOrders(prevState, formData);
    if (next.status === "success") {
      clearCart();
      setTimeout(() => setCheckoutOpen(false), 1200);
    }
    return next;
  }, initialState);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.product.priceMinis || 0) * item.quantity, 0),
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

  const openCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutItems(cart);
    setCheckoutOpen(true);
  };

  return (
    <div className="space-y-4 pb-20">
      <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Cart</p>
        {cart.length > 0 && (
          <div className="mt-4 space-y-3 text-xs text-gray-600">
            {cart.map((item, index) => (
              <div key={item.product.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {cart.length > 1 && (
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-[10px] font-semibold text-black">
                      {index + 1}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p
                      className="max-w-[140px] truncate font-semibold text-black sm:max-w-[240px]"
                      title={item.product.name}
                    >
                      {item.product.name}
                    </p>
                    <p className="text-gray-500">{formatMinis(item.product.priceMinis)} each</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    className="h-7 w-7 rounded-full border border-black/10 text-xs font-semibold text-black"
                  >
                    -
                  </button>
                  <span className="min-w-[24px] text-center text-xs font-semibold text-black">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    className="h-7 w-7 rounded-full border border-black/10 text-xs font-semibold text-black"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    aria-label={`Remove ${item.product.name}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-red-200 text-red-600 transition hover:bg-red-50"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                      <path
                        fill="currentColor"
                        d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7H4a1 1 0 1 1 0-2h4V4a1 1 0 0 1 1-1Zm1 2v1h4V5h-4Zm-3 3v10h10V8H7Zm3 2a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Zm5 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 2 0Z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4">
          <div>
            <p className="text-sm text-gray-600">
              {cart.length ? `${cart.length} item(s) · ${formatMinis(cartTotal)}` : "Your cart is empty."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCheckout}
              disabled={cart.length === 0}
              className="rounded-full bg-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Checkout
            </button>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => clearCart()}
                className="rounded-full border border-black/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-black"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

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
                  className={`text-sm ${state.status === "success" ? "text-emerald-600" : "text-red-500"}`}
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
