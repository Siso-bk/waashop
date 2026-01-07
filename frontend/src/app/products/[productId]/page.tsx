import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser, getStandardProductById, getStandardProducts } from "@/lib/queries";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { ProductDetailLoader } from "@/components/ProductDetailLoader";

interface Props {
  params: Promise<{ productId: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const productId = resolvedParams.productId;
  const [directProduct, user] = await Promise.all([getStandardProductById(productId), getSessionUser()]);
  const product =
    directProduct ??
    (await getStandardProducts()).find((item) => item.id === productId) ??
    null;

  return (
    <div className="space-y-6 pb-10">
      <Link href="/shop?tab=products" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to products
      </Link>
      {product ? (
        <ProductDetailClient product={product} signedIn={Boolean(user)} />
      ) : (
        <ProductDetailLoader productId={productId} signedIn={Boolean(user)} />
      )}
    </div>
  );
}
