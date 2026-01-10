"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductCategory, StandardProduct } from "@/types";
import { StandardProductOrderCard } from "@/components/StandardProductOrderCard";
import { formatMinis } from "@/lib/minis";
import Link from "next/link";
import { addToCart, setCartItems, useCart } from "@/lib/cart";

type ShopProductsClientProps = {
  products: StandardProduct[];
  categories: ProductCategory[];
  signedIn: boolean;
  query?: string;
};
export function ShopProductsClient({ products, categories, signedIn, query }: ShopProductsClientProps) {
  const router = useRouter();
  const cart = useCart();
  const [message, setMessage] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<
    "featured" | "newest" | "popular" | "price-asc" | "price-desc" | "name-asc"
  >("featured");
  const [cityFilter, setCityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("available");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const normalizedQuery = query?.trim().toLowerCase() ?? "";
  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) return products;
    return products.filter((product) => {
      const haystack = `${product.name} ${product.description ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery, products]);
  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((product) => {
      if (product.vendorCity) set.add(product.vendorCity);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);
  const vendorOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((product) => {
      if (product.vendorName) set.add(product.vendorName);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);
  const displayProducts = useMemo(() => {
    const filteredByCity =
      cityFilter === "all"
        ? filteredProducts
        : filteredProducts.filter((product) => product.vendorCity === cityFilter);
    const filteredByVendor =
      vendorFilter === "all"
        ? filteredByCity
        : filteredByCity.filter((product) => product.vendorName === vendorFilter);
    const filteredByCategory =
      categoryFilter === "all"
        ? filteredByVendor
        : filteredByVendor.filter((product) =>
            (product.categories ?? []).some((category) => category.toLowerCase() === categoryFilter)
          );
    const filteredByPrice = filteredByCategory.filter((product) => {
      const price = product.priceMinis ?? 0;
      const min = minPrice ? Number(minPrice) : null;
      const max = maxPrice ? Number(maxPrice) : null;
      if (min !== null && !Number.isNaN(min) && price < min) return false;
      if (max !== null && !Number.isNaN(max) && price > max) return false;
      return true;
    });
    const filteredByAvailability =
      availabilityFilter === "all"
        ? filteredByPrice
        : availabilityFilter === "available"
          ? filteredByPrice.filter((product) => (product.status ?? "ACTIVE") === "ACTIVE")
          : filteredByPrice.filter((product) => (product.status ?? "ACTIVE") !== "ACTIVE");
    if (sortKey === "price-asc") {
      return [...filteredByAvailability].sort((a, b) => (a.priceMinis || 0) - (b.priceMinis || 0));
    }
    if (sortKey === "price-desc") {
      return [...filteredByAvailability].sort((a, b) => (b.priceMinis || 0) - (a.priceMinis || 0));
    }
    if (sortKey === "name-asc") {
      return [...filteredByAvailability].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortKey === "newest") {
      return [...filteredByAvailability].sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    }
    if (sortKey === "popular") {
      return [...filteredByAvailability].sort((a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    }
    return filteredByAvailability;
  }, [
    availabilityFilter,
    categoryFilter,
    cityFilter,
    filteredProducts,
    maxPrice,
    minPrice,
    sortKey,
    vendorFilter,
  ]);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + (item.product.priceMinis || 0) * item.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleResize = () => {
      const delta = window.innerHeight - viewport.height;
      setKeyboardOpen(delta > 140);
    };
    handleResize();
    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

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
      <div className="web-panel border-dashed p-8 text-center text-sm text-[color:var(--app-text-muted)]">
        Sign in to add products to your cart.
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="web-panel flex flex-wrap items-center justify-between gap-3 rounded-3xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--app-text-muted)]">
          <span className="web-kicker">Results</span>
          <span className="web-chip px-3 py-1 text-xs font-semibold">
            {displayProducts.length}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {categories.length > 0 && (
            <label className="flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--surface-bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] text-[color:var(--app-text-muted)]">
              Category
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-md bg-[color:var(--surface-bg)] text-[10px] font-semibold text-[color:var(--app-text)] outline-none"
              >
                <option value="all">All</option>
                {categories.map((category) => (
                  <option key={category.key} value={category.key.toLowerCase()}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {vendorOptions.length > 1 && (
            <label className="flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--surface-bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] text-[color:var(--app-text-muted)]">
              Vendor
              <select
                value={vendorFilter}
                onChange={(event) => setVendorFilter(event.target.value)}
                className="rounded-md bg-[color:var(--surface-bg)] text-[10px] font-semibold text-[color:var(--app-text)] outline-none"
              >
                <option value="all">All</option>
                {vendorOptions.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </label>
          )}
          {cityOptions.length > 1 && (
            <label className="flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--surface-bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] text-[color:var(--app-text-muted)]">
              City
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="rounded-md bg-[color:var(--surface-bg)] text-[10px] font-semibold text-[color:var(--app-text)] outline-none"
              >
                <option value="all">All</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--surface-bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] text-[color:var(--app-text-muted)]">
            Price
            <input
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              inputMode="numeric"
              placeholder="Min"
              className="w-16 bg-transparent text-[10px] font-semibold text-[color:var(--app-text)] outline-none placeholder:text-[color:var(--app-text-muted)]"
            />
            <span className="text-[color:var(--app-text-muted)]">-</span>
            <input
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              inputMode="numeric"
              placeholder="Max"
              className="w-16 bg-transparent text-[10px] font-semibold text-[color:var(--app-text)] outline-none placeholder:text-[color:var(--app-text-muted)]"
            />
          </label>
          <label className="flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--surface-bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] text-[color:var(--app-text-muted)]">
            Availability
            <select
              value={availabilityFilter}
              onChange={(event) =>
                setAvailabilityFilter(event.target.value as "all" | "available" | "unavailable")
              }
              className="rounded-md bg-[color:var(--surface-bg)] text-[10px] font-semibold text-[color:var(--app-text)] outline-none"
            >
              <option value="available">Available</option>
              <option value="all">All</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--surface-bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] text-[color:var(--app-text-muted)]">
            Sort
            <select
              value={sortKey}
              onChange={(event) =>
                setSortKey(
                  event.target.value as
                    | "featured"
                    | "newest"
                    | "popular"
                    | "price-asc"
                    | "price-desc"
                    | "name-asc"
                )
              }
              className="rounded-md bg-[color:var(--surface-bg)] text-[10px] font-semibold text-[color:var(--app-text)] outline-none"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name-asc">Name: A → Z</option>
            </select>
          </label>
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {displayProducts.map((product) => (
          <StandardProductOrderCard
            key={product.id}
            product={product}
            signedIn={signedIn}
            onAddToCart={handleAddToCart}
            onOrderNow={orderNow}
          />
        ))}
        {displayProducts.length === 0 && (
          <div className="web-panel border-dashed p-8 text-center text-sm text-[color:var(--app-text-muted)]">
            {products.length === 0
              ? "No products available right now. Check back soon."
              : "No products match your search."}
          </div>
        )}
      </div>

      {cart.length > 0 && !keyboardOpen && (
        <section className="web-panel fixed bottom-24 left-1/2 z-30 w-[min(640px,92%)] -translate-x-1/2 p-5 shadow-xl backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--app-text-muted)]">Cart</p>
              <p className="text-sm text-[color:var(--app-text-muted)]">
                {cart.length ? `${cart.length} item(s) · ${formatMinis(cartTotal)}` : "Your cart is empty."}
              </p>
            </div>
            <Link
              href="/cart"
              className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--app-border)] bg-[color:var(--panel-bg)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--app-foreground)] transition hover:border-[color:var(--app-border-strong)]"
            >
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--app-border)] bg-[color:var(--surface-bg)]">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4 text-[color:var(--app-foreground)]"
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
          {message && <p className="mt-3 text-xs text-emerald-500">{message}</p>}
        </section>
      )}
    </div>
  );
}
