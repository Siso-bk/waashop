export type FavoriteProduct = {
  id: string;
  name: string;
  priceMinis: number;
  imageUrl?: string;
  vendorName?: string;
};

const FAVORITES_KEY = "waashop-favorites";

const readStorage = (): FavoriteProduct[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FavoriteProduct[]) : [];
  } catch {
    return [];
  }
};

const writeStorage = (items: FavoriteProduct[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("favorites:updated"));
};

export const readFavorites = () => readStorage();

export const toggleFavorite = (product: FavoriteProduct) => {
  const items = readStorage();
  const exists = items.some((item) => item.id === product.id);
  const next = exists ? items.filter((item) => item.id !== product.id) : [product, ...items];
  writeStorage(next);
  return { items: next, isFavorite: !exists };
};

export const isFavorite = (id: string) => readStorage().some((item) => item.id === id);
