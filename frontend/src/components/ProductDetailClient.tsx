"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { StandardProduct } from "@/types";
import { addToCart, setCartItems } from "@/lib/cart";
import { formatMinis } from "@/lib/minis";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

export function ProductDetailClient({
  product,
  signedIn,
}: {
  product: StandardProduct;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const images = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
  const [activeImage, setActiveImage] = useState(images[0] || "");

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

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {images.length > 0 && (
            <div className="space-y-3">
              <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-black/10">
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((url) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveImage(url)}
                      className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border transition ${
                        url === activeImage
                          ? "border-black ring-2 ring-black/70"
                          : "border-black/10 hover:border-black/30"
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

          <div className="rounded-2xl border border-black/10 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Description</p>
            {product.description ? (
              <p className="mt-2">{product.description}</p>
            ) : (
              <p className="mt-2 text-gray-500">No description provided yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Product</p>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold text-black">{product.name}</h1>
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/20 bg-white/70 text-black shadow-sm transition hover:border-black/40"
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
              <p className="text-xs text-gray-500">Vendor: {product.vendorName}</p>
            )}
            {product.vendorCity && (
              <p className="text-xs text-gray-500">Store city: {product.vendorCity}</p>
            )}
            {product.vendorAddress && (
              <p className="text-xs text-gray-500">Store address: {product.vendorAddress}</p>
            )}
            {product.vendorPhone && (
              <p className="text-xs text-gray-500">Store phone: {product.vendorPhone}</p>
            )}
          </div>

          <div className="rounded-2xl border border-black/10 bg-gray-50 p-4 text-sm text-gray-600">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Store</p>
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <p>
                <span className="text-gray-400">Address:</span>{" "}
                {product.vendorAddress || "Not provided"}
              </p>
              <p>
                <span className="text-gray-400">Support:</span>{" "}
                {product.vendorPhone || "Contact Waashop support"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-black px-5 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Price</p>
            <p className="text-2xl font-semibold">{formatMinis(product.priceMinis)}</p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.3em] text-gray-400">Product ID</span>
              <span className="font-semibold text-black">{product.id}</span>
            </div>
            {product.vendorName && (
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-[0.3em] text-gray-400">Vendor</span>
                <span className="font-semibold text-black">{product.vendorName}</span>
              </div>
            )}
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
              <span className="font-semibold text-black">
                {product.vendorPhone || "Waashop help desk"}
              </span>
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
                className="w-full rounded-full border border-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-black transition hover:bg-black hover:text-white"
              >
                Add to cart
              </button>
              <button
                type="button"
                onClick={handleOrderNow}
                className="w-full rounded-full border border-white/15 bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gray-900"
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
