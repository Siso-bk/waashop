"use client";

import { useSyncExternalStore } from "react";
import type { StandardProduct } from "@/types";

export type CartItem = {
  product: StandardProduct;
  quantity: number;
};

const CART_KEY = "waashop:cart";

let cachedRaw: string | null = null;
let cachedCart: CartItem[] = [];
const emptyCartSnapshot: CartItem[] = [];

const readCart = (): CartItem[] => {
  if (typeof window === "undefined") return cachedCart;
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (raw === cachedRaw) return cachedCart;
    if (!raw) {
      cachedRaw = null;
      cachedCart = [];
      return cachedCart;
    }
    const parsed = JSON.parse(raw) as CartItem[];
    cachedRaw = raw;
    cachedCart = Array.isArray(parsed)
      ? parsed
          .filter((item) => item?.product?.id)
          .map((item) => ({ ...item, quantity: Math.max(1, item.quantity || 1) }))
      : [];
    return cachedCart;
  } catch {
    cachedRaw = null;
    cachedCart = [];
    return cachedCart;
  }
};

const writeCart = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(items);
  cachedRaw = raw;
  cachedCart = items;
  window.localStorage.setItem(CART_KEY, raw);
  window.dispatchEvent(new Event("waashop:cart"));
};

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    if ((event as StorageEvent).key && (event as StorageEvent).key !== CART_KEY) return;
    callback();
  };
  window.addEventListener("storage", handler as EventListener);
  window.addEventListener("waashop:cart", callback as EventListener);
  return () => {
    window.removeEventListener("storage", handler as EventListener);
    window.removeEventListener("waashop:cart", callback as EventListener);
  };
};

export const useCart = () =>
  useSyncExternalStore(subscribe, readCart, () => emptyCartSnapshot);

export const addToCart = (product: StandardProduct) => {
  const current = readCart();
  const existing = current.find((item) => item.product.id === product.id);
  if (existing) {
    writeCart(
      current.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
    return;
  }
  writeCart([...current, { product, quantity: 1 }]);
};

export const setCartItems = (items: CartItem[]) => {
  writeCart(items);
};

export const updateCartQuantity = (productId: string, quantity: number) => {
  const current = readCart();
  const next = current
    .map((item) =>
      item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
    )
    .filter((item) => item.quantity > 0);
  writeCart(next);
};

export const removeFromCart = (productId: string) => {
  const current = readCart();
  writeCart(current.filter((item) => item.product.id !== productId));
};

export const clearCart = () => {
  writeCart([]);
};
