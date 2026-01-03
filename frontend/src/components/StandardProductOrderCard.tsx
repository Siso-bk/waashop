"use client";

import { useFormState, useFormStatus } from "react-dom";
import { formatMinis } from "@/lib/minis";
import type { StandardProduct } from "@/types";

type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: ActionState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Placing..." : "Place order"}
    </button>
  );
}

export function StandardProductOrderCard({
  product,
  signedIn,
  createOrder,
}: {
  product: StandardProduct;
  signedIn: boolean;
  createOrder: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, action] = useFormState(createOrder, initialState);

  return (
    <article className="flex min-w-[280px] flex-col rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
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
          Sign in to place an order.
        </div>
      ) : (
        <form action={action} className="mt-6 space-y-3 text-sm text-gray-700">
          <input type="hidden" name="productId" value={product.id} />
          <input
            name="shippingName"
            placeholder="Full name"
            className="w-full rounded-xl border border-black/10 px-3 py-2"
            required
          />
          <input
            name="shippingPhone"
            placeholder="Phone number"
            className="w-full rounded-xl border border-black/10 px-3 py-2"
            required
          />
          <textarea
            name="shippingAddress"
            placeholder="Shipping address"
            rows={2}
            className="w-full rounded-xl border border-black/10 px-3 py-2"
            required
          />
          <textarea
            name="notes"
            placeholder="Order notes (optional)"
            rows={2}
            className="w-full rounded-xl border border-black/10 px-3 py-2"
          />
          <SubmitButton />
          {state.status !== "idle" && (
            <p
              className={`text-xs ${
                state.status === "success" ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {state.message}
            </p>
          )}
        </form>
      )}
    </article>
  );
}
