"use client";

import Image from "next/image";
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
  const hasImage = Boolean(product.imageUrl);
  const imageSrc = product.imageUrl || "/images/no-image.svg";
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
        <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-black/10 bg-[color:var(--surface-bg)]">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className={hasImage ? "object-cover" : "object-contain p-6"}
            sizes="(max-width: 768px) 100vw, 100vw"
          />
        </div>
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
