import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser, getStandardProductById, getStandardProducts } from "@/lib/queries";
import { ProductDetailClient } from "@/components/ProductDetailClient";

interface Props {
  params: { productId: string };
}

export default async function ProductDetailPage({ params }: Props) {
  const [directProduct, user] = await Promise.all([
    getStandardProductById(params.productId),
    getSessionUser(),
  ]);
  const product =
    directProduct ??
    (await getStandardProducts()).find((item) => item.id === params.productId) ??
    null;

  if (!product) {
    return (
      <div className="space-y-6 pb-10">
        <Link href="/shop?tab=products" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to products
        </Link>
        <div className="rounded-3xl border border-black/10 bg-white p-8 text-center text-sm text-gray-500">
          This product is no longer available.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Link href="/shop?tab=products" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to products
      </Link>
      <ProductDetailClient product={product} signedIn={Boolean(user)} />
    </div>
  );
}
