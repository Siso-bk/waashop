"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { formatMinis } from "@/lib/minis";
import type { StandardProduct } from "@/types";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

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
  const imageSrc = product.imageUrls?.[0] || product.imageUrl || "/images/no-image.svg";
  const favorite = useSyncExternalStore(
    (onStoreChange) => {
      const handleUpdate = () => onStoreChange();
      window.addEventListener("favorites:updated", handleUpdate);
      return () => window.removeEventListener("favorites:updated", handleUpdate);
    },
    () => isFavorite(product.id),
    () => false
  );

  return (
    <article className="web-card group relative flex h-full min-h-[360px] flex-col rounded-3xl p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
      <button
        type="button"
        onClick={() => {
          toggleFavorite({
            id: product.id,
            name: product.name,
            priceMinis: product.priceMinis,
            imageUrl: product.imageUrls?.[0] || product.imageUrl,
            vendorName: product.vendorName,
          });
        }}
        className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-zinc-800/80 text-white shadow-sm transition hover:border-white/80"
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill={favorite ? "#e11d48" : "none"}
            stroke={favorite ? "#e11d48" : "currentColor"}
            strokeWidth="1.7"
            d="M12 20.25l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 5 4 3 6.5 3c1.74 0 3.41.81 4.5 2.09C12.09 3.81 13.76 3 15.5 3 18 3 20 5 20 7.5c0 3.78-3.4 6.86-8.55 11.43L12 20.25z"
          />
        </svg>
      </button>
      <Link
        href={`/products/${product.id}`}
        aria-label={`View ${product.name}`}
        className="relative z-10 flex flex-1 flex-col"
      >
        <div className="relative z-10">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[color:var(--app-border)] bg-[color:var(--surface-bg)]">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 100vw"
              unoptimized
            />
          </div>
        </div>
        <div className="relative z-10 mt-3 space-y-1">
          <p className="line-clamp-2 text-sm font-semibold text-[color:var(--app-foreground)]">{product.name}</p>
          <p className="text-xs font-semibold text-[color:var(--app-foreground)]">
            {formatMinis(product.priceMinis)}
          </p>
          {(product.vendorName || product.vendorCity) && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[color:var(--app-text-muted)]">
              {product.vendorName && <span className="truncate">By {product.vendorName}</span>}
              {product.vendorCity && <span className="truncate">{product.vendorCity}</span>}
              {product.vendorStatus === "APPROVED" && (
                <span className="rounded-full border border-emerald-300/60 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                  Verified
                </span>
              )}
            </div>
          )}
          <div className="text-[11px] text-[color:var(--app-text-muted)]">
            {typeof product.averageRating === "number" && typeof product.totalReviews === "number"
              ? `${product.averageRating.toFixed(1)} ★ (${product.totalReviews})`
              : "No ratings yet"}
          </div>
        </div>
      </Link>

      {!signedIn ? (
        <div className="relative z-10 mt-auto rounded-2xl border border-dashed border-[color:var(--app-border)] bg-[color:var(--surface-bg)] p-4 text-xs text-[color:var(--app-text-muted)]">
          Sign in to add to cart or place an order.
        </div>
      ) : (
        <div className="relative z-10 mt-auto space-y-2 text-sm text-[color:var(--app-text-muted)]">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAddToCart(product);
            }}
            className="action-add-cart w-full rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] transition hover:opacity-90"
          >
            Add to cart
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOrderNow(product);
            }}
            className="action-buy-now w-full rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] transition hover:opacity-90"
          >
            Order now
          </button>
        </div>
      )}
    </article>
  );
}
