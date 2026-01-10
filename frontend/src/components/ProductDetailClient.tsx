"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ProductReview, ReviewSummary, StandardProduct } from "@/types";
import { addToCart, setCartItems } from "@/lib/cart";
import { formatMinis } from "@/lib/minis";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

export function ProductDetailClient({
  product,
  signedIn,
  reviews = [],
  reviewSummary = { averageRating: 0, totalReviews: 0 },
}: {
  product: StandardProduct;
  signedIn: boolean;
  reviews?: ProductReview[];
  reviewSummary?: ReviewSummary;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const images = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
  const [activeImage, setActiveImage] = useState(images[0] || "");
  const [zoomOpen, setZoomOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const ratingText = useMemo(() => {
    if (!reviewSummary.totalReviews) return "No ratings yet";
    return `${reviewSummary.averageRating.toFixed(1)} ★ (${reviewSummary.totalReviews})`;
  }, [reviewSummary.averageRating, reviewSummary.totalReviews]);

  useEffect(() => {
    setFavorite(isFavorite(product.id));
    const handleUpdate = () => setFavorite(isFavorite(product.id));
    window.addEventListener("favorites:updated", handleUpdate);
    return () => window.removeEventListener("favorites:updated", handleUpdate);
  }, [product.id]);

  useEffect(() => {
    if (!images.length) {
      setActiveImage("");
      return;
    }
    if (!activeImage || !images.includes(activeImage)) {
      setActiveImage(images[0]);
    }
  }, [activeImage, images]);

  const handleAddToCart = () => {
    addToCart(product);
    setMessage("Added to cart.");
    setTimeout(() => setMessage(null), 1200);
  };

  const handleOrderNow = () => {
    setCartItems([{ product, quantity: 1 }]);
    router.push("/cart?checkout=1");
  };

  const submitReview = async () => {
    if (!signedIn) {
      setReviewError("Sign in to leave a review.");
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          title: reviewTitle.trim() || undefined,
          body: reviewBody.trim() || undefined,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Unable to submit review");
      }
      setReviewSuccess("Review submitted. Thank you!");
      setReviewTitle("");
      setReviewBody("");
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Unable to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="web-panel rounded-3xl p-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {images.length > 0 && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setZoomOpen(true)}
                className="relative h-72 w-full overflow-hidden rounded-2xl border border-[color:var(--surface-border)]"
                aria-label="Open image preview"
              >
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                />
              </button>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
                  {images.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveImage(url)}
                      className={`relative h-16 w-16 flex-shrink-0 snap-start overflow-hidden rounded-xl border transition ${
                        url === activeImage
                          ? "border-black ring-2 ring-black/70 dark:border-white dark:ring-white/60"
                          : "border-[color:var(--surface-border)] hover:border-black/30 dark:hover:border-white/40"
                      }`}
                      aria-label="Preview image"
                    >
                      <Image src={url} alt={product.name} fill className="object-cover" sizes="64px" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="web-card rounded-2xl p-4 text-sm text-[color:var(--app-text-muted)]">
            <p className="web-kicker">Description</p>
            {product.description ? (
              <p className="mt-2 text-[color:var(--app-text)]">{product.description}</p>
            ) : (
              <p className="mt-2 text-[color:var(--app-text-muted)]">No description provided yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="web-kicker">Product</p>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold text-[color:var(--app-text)]">{product.name}</h1>
              <button
                type="button"
                onClick={() => {
                  const result = toggleFavorite({
                    id: product.id,
                    name: product.name,
                    priceMinis: product.priceMinis,
                    imageUrl: product.imageUrls?.[0] || product.imageUrl,
                    vendorName: product.vendorName,
                  });
                  setFavorite(result.isFavorite);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-[color:var(--surface-bg)] text-[color:var(--app-foreground)] shadow-sm transition hover:border-white"
                aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path
                    fill={favorite ? "#e11d48" : "none"}
                    stroke={favorite ? "#e11d48" : "currentColor"}
                    strokeWidth="1.7"
                    d="M12 20.25l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 5 4 3 6.5 3c1.74 0 3.41.81 4.5 2.09C12.09 3.81 13.76 3 15.5 3 18 3 20 5 20 7.5c0 3.78-3.4 6.86-8.55 11.43L12 20.25z"
                  />
                </svg>
              </button>
            </div>
            {product.vendorName && (
              <p className="text-xs text-[color:var(--app-text-muted)]">Vendor: {product.vendorName}</p>
            )}
            {product.vendorCity && (
              <p className="text-xs text-[color:var(--app-text-muted)]">Store city: {product.vendorCity}</p>
            )}
            {product.vendorAddress && (
              <p className="text-xs text-[color:var(--app-text-muted)]">Store address: {product.vendorAddress}</p>
            )}
            {product.vendorPhone && (
              <p className="text-xs text-[color:var(--app-text-muted)]">Store phone: {product.vendorPhone}</p>
            )}
            <p className="text-xs text-emerald-500">{ratingText}</p>
          </div>

          <div className="web-card rounded-2xl p-4 text-sm text-[color:var(--app-text-muted)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="web-kicker">Store</p>
              {product.vendorStatus === "APPROVED" && (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-emerald-500">
                  Verified
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-[color:var(--app-border)] bg-[color:var(--surface-bg)]">
                {product.vendorLogoUrl ? (
                  <Image src={product.vendorLogoUrl} alt={product.vendorName || "Vendor"} width={48} height={48} />
                ) : (
                  <span className="text-xs font-semibold text-[color:var(--app-text-muted)]">
                    {product.vendorName?.slice(0, 2).toUpperCase() || "WS"}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[color:var(--app-text)]">
                  {product.vendorName || "Waashop vendor"}
                </p>
                <p className="text-xs text-[color:var(--app-text-muted)]">
                  {product.vendorCity || "City"} · {product.vendorCountry || "Country"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-[color:var(--app-text-muted)] sm:grid-cols-2">
              <p>
                <span className="text-[color:var(--app-text-muted)]">Fulfillment:</span>{" "}
                <span className="text-[color:var(--app-text)]">
                  {product.vendorFulfillmentMethod || "Shipping"}
                </span>
              </p>
              <p>
                <span className="text-[color:var(--app-text-muted)]">Processing:</span>{" "}
                <span className="text-[color:var(--app-text)]">
                  {product.vendorProcessingTime?.replace(/_/g, " ").toLowerCase() || "1-3 days"}
                </span>
              </p>
              <p className="sm:col-span-2">
                <span className="text-[color:var(--app-text-muted)]">Address:</span>{" "}
                <span className="text-[color:var(--app-text)]">
                  {product.vendorAddress || "Not provided"}
                </span>
              </p>
              <p>
                <span className="text-[color:var(--app-text-muted)]">Support:</span>{" "}
                <span className="text-[color:var(--app-text)]">
                  {product.vendorPhone || product.vendorEmail || "Contact Waashop support"}
                </span>
              </p>
              {product.vendorWebsite && (
                <p>
                  <span className="text-[color:var(--app-text-muted)]">Website:</span>{" "}
                  <a className="text-[color:var(--app-text)] underline" href={product.vendorWebsite}>
                    Visit
                  </a>
                </p>
              )}
            </div>
            {product.vendorReturnsPolicy && (
              <p className="mt-3 text-xs text-[color:var(--app-text-muted)]">
                Returns: <span className="text-[color:var(--app-text)]">{product.vendorReturnsPolicy}</span>
              </p>
            )}
          </div>

          <div className="web-card rounded-2xl p-4 text-sm text-[color:var(--app-text-muted)]">
            <p className="web-kicker">Buyer protection</p>
            <p className="mt-2 text-[color:var(--app-text)]">
              Your minis stay in escrow until delivery is confirmed. If there’s an issue, you can dispute the order.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.26em] text-emerald-500">
              <span className="rounded-full border border-emerald-400/40 px-3 py-1">Escrow protected</span>
              <span className="rounded-full border border-emerald-400/40 px-3 py-1">Verified vendors</span>
              <span className="rounded-full border border-emerald-400/40 px-3 py-1">Dispute window</span>
            </div>
          </div>

          <div className="rounded-2xl border border-black bg-[#000] px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Price</p>
            <p className="text-2xl font-semibold">{formatMinis(product.priceMinis)}</p>
          </div>

          <div className="web-card grid gap-3 rounded-2xl p-4 text-xs text-[color:var(--app-text-muted)]">
            <div className="flex items-center justify-between">
              <span className="web-kicker">Product ID</span>
              <span className="font-semibold text-[color:var(--app-text)]">{product.id}</span>
            </div>
            {product.vendorName && (
              <div className="flex items-center justify-between">
                <span className="web-kicker">Vendor</span>
                <span className="font-semibold text-[color:var(--app-text)]">{product.vendorName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="web-kicker">Status</span>
              <span className="font-semibold text-[color:var(--app-text)]">Available</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="web-kicker">Checkout</span>
              <span className="font-semibold text-[color:var(--app-text)]">Secure wallet flow</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="web-kicker">Support</span>
              <span className="font-semibold text-[color:var(--app-text)]">
                {product.vendorPhone || "Waashop help desk"}
              </span>
            </div>
          </div>

          {!signedIn ? (
            <div className="rounded-2xl border border-dashed border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-4 text-xs text-[color:var(--app-text-muted)]">
              <p>Sign in to add to cart or place an order.</p>
              <Link href="/login" className="mt-2 inline-flex text-xs font-semibold text-[color:var(--app-text)] underline">
                Sign in
              </Link>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-[color:var(--app-text-muted)]">
              <button
                type="button"
                onClick={handleAddToCart}
                className="action-add-cart w-full rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition hover:opacity-90"
              >
                Add to cart
              </button>
              <button
                type="button"
                onClick={handleOrderNow}
                className="action-buy-now w-full rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition hover:opacity-90"
              >
                Order now
              </button>
              {message && <p className="text-xs text-emerald-500">{message}</p>}
            </div>
          )}
          <div className="web-card rounded-2xl p-4 text-sm text-[color:var(--app-text-muted)]">
            <p className="web-kicker">Ratings & reviews</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="text-[color:var(--app-text)]">{ratingText}</span>
              <span className="rounded-full border border-[color:var(--app-border)] px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                Verified purchases highlighted
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {reviews.slice(0, 4).map((review) => (
                <div key={review.id} className="rounded-2xl border border-[color:var(--app-border)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--app-text-muted)]">
                    <span className="text-[color:var(--app-text)]">{review.userLabel}</span>
                    <span>{review.rating} ★</span>
                  </div>
                  {review.title && (
                    <p className="mt-1 text-sm font-semibold text-[color:var(--app-text)]">{review.title}</p>
                  )}
                  {review.body && <p className="mt-1 text-xs text-[color:var(--app-text-muted)]">{review.body}</p>}
                  {review.verifiedPurchase && (
                    <span className="mt-2 inline-flex rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.26em] text-emerald-500">
                      Verified
                    </span>
                  )}
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-xs text-[color:var(--app-text-muted)]">No reviews yet. Be the first.</p>
              )}
            </div>
            <div className="mt-4 rounded-2xl border border-[color:var(--app-border)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--app-text-muted)]">
                Leave a review
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[5, 4, 3, 2, 1].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReviewRating(value)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                      reviewRating === value
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-500"
                        : "border-[color:var(--app-border)] text-[color:var(--app-text-muted)]"
                    }`}
                  >
                    {value} ★
                  </button>
                ))}
              </div>
              <input
                value={reviewTitle}
                onChange={(event) => setReviewTitle(event.target.value)}
                placeholder="Title (optional)"
                className="mt-3 w-full rounded-xl border border-[color:var(--app-border)] bg-[color:var(--surface-bg)] px-3 py-2 text-xs text-[color:var(--app-text)] placeholder:text-[color:var(--app-text-muted)]"
              />
              <textarea
                value={reviewBody}
                onChange={(event) => setReviewBody(event.target.value)}
                placeholder="Share details about this product"
                rows={3}
                className="mt-2 w-full rounded-xl border border-[color:var(--app-border)] bg-[color:var(--surface-bg)] px-3 py-2 text-xs text-[color:var(--app-text)] placeholder:text-[color:var(--app-text-muted)]"
              />
              <button
                type="button"
                onClick={submitReview}
                disabled={submittingReview}
                className="mt-3 w-full rounded-full border border-black bg-[#000] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-gray-700"
              >
                {submittingReview ? "Submitting..." : "Submit review"}
              </button>
              <div className="mt-2 min-h-[18px] text-xs">
                {reviewError && <p className="text-rose-500">{reviewError}</p>}
                {reviewSuccess && <p className="text-emerald-500">{reviewSuccess}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
      {zoomOpen && activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-full max-w-4xl">
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white"
              aria-label="Close image preview"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 0 0-1.4 1.4L10.6 12l-4.9 4.9a1 1 0 0 0 1.4 1.4L12 13.4l4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4Z"
                />
              </svg>
            </button>
            <div className="relative h-[70vh] w-full overflow-hidden rounded-3xl border border-white/10 bg-black">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 70vw"
                unoptimized
              />
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {images.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImage(url)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border transition ${
                      url === activeImage ? "border-white ring-2 ring-white/60" : "border-white/20 hover:border-white/60"
                    }`}
                    aria-label="Preview image"
                  >
                    <Image src={url} alt={product.name} fill className="object-cover" sizes="64px" unoptimized />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
