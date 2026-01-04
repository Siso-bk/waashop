"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const handleNavigate = () => {
    router.push(`/products/${product.id}`);
  };

  return (
    <article
      className="group relative flex cursor-pointer flex-col rounded-3xl border border-black/10 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-lg"
      role="link"
      tabIndex={0}
      aria-label={`View ${product.name}`}
      onClick={handleNavigate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleNavigate();
        }
      }}
    >
      <div className="relative z-10 mb-2 block">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <div className="h-28 w-full overflow-hidden rounded-2xl border border-black/10 bg-white">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/15 bg-gray-50">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 text-gray-400">
              <path
                fill="currentColor"
                d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9A2.5 2.5 0 0 1 17.5 17h-11A2.5 2.5 0 0 1 4 14.5v-9Zm2.5-.5a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V9l-3.2 3.2a1 1 0 0 1-1.3.1L10 11l-4 4V5.5a.5.5 0 0 0-.5-.5Z"
              />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gray-400">
              No image
            </span>
          </div>
        )}
      </div>
      <div className="relative z-10 space-y-0.5 text-xs text-gray-500">
        <p>
          <span className="uppercase tracking-[0.3em] text-gray-400">Name:</span>{" "}
          <span className="block truncate text-sm font-semibold text-black">{product.name}</span>
        </p>
        <p>
          <span className="uppercase tracking-[0.3em] text-gray-400">Price:</span>{" "}
          <span className="text-sm font-semibold text-black">{formatMinis(product.priceMinis)}</span>
        </p>
      </div>

      {!signedIn ? (
        <div className="relative z-10 mt-5 rounded-2xl border border-dashed border-black/15 bg-gray-50 p-4 text-xs text-gray-600">
          Sign in to add to cart or place an order.
        </div>
      ) : (
        <div className="relative z-10 mt-5 space-y-2 text-sm text-gray-700">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddToCart(product);
            }}
            className="w-full rounded-full border border-black/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-black transition hover:bg-black hover:text-white"
          >
            Add to cart
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOrderNow(product);
            }}
            className="w-full rounded-full bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-white transition hover:bg-gray-900"
          >
            Order now
          </button>
        </div>
      )}
    </article>
  );
}
