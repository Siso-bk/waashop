import Link from "next/link";
import { getSessionUser } from "@/lib/queries";
import { backendFetch } from "@/lib/backendClient";
import { CartClient } from "@/components/CartClient";

type OrderState = { status: "idle" | "success" | "error"; message?: string };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CartPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-gray-600">Sign in to view your cart.</p>
        <p className="text-xs text-gray-500">Use your email or username@pai.</p>
        <Link
          href="/login?redirect=/cart"
          className="inline-flex rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialCheckout = resolvedParams?.checkout === "1";

  return <CartClient initialCheckout={initialCheckout} createCartOrders={createCartOrders} />;
}

async function createCartOrders(_prev: OrderState, formData: FormData): Promise<OrderState> {
  "use server";
  const itemsRaw = formData.get("items");
  if (!itemsRaw || typeof itemsRaw !== "string") {
    return { status: "error", message: "Your cart is empty." };
  }
  let items: Array<{ productId: string; quantity: number }> = [];
  try {
    const parsed = JSON.parse(itemsRaw) as Array<{ productId?: string; quantity?: number }>;
    items = parsed
      .filter((item) => item.productId)
      .map((item) => ({
        productId: String(item.productId),
        quantity: Number(item.quantity || 1),
      }));
  } catch {
    return { status: "error", message: "Unable to read cart items." };
  }
  if (items.length === 0) {
    return { status: "error", message: "Your cart is empty." };
  }
  const shippingName = valueOrUndefined(formData.get("shippingName"));
  const shippingPhone = valueOrUndefined(formData.get("shippingPhone"));
  const shippingAddress = valueOrUndefined(formData.get("shippingAddress"));
  const notes = valueOrUndefined(formData.get("notes"));
  if (!shippingName || !shippingPhone || !shippingAddress) {
    return { status: "error", message: "Shipping name, phone, and address are required." };
  }
  try {
    for (const item of items) {
      await backendFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
          shippingName,
          shippingPhone,
          shippingAddress,
          notes,
        }),
      });
    }
    return { status: "success", message: "Order placed. Track it in your orders page." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to place order.";
    return { status: "error", message };
  }
}

const valueOrUndefined = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};
