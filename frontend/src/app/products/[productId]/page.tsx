import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser, getStandardProductById } from "@/lib/queries";
import { ProductDetailClient } from "@/components/ProductDetailClient";

interface Props {
  params: { productId: string };
}

export default async function ProductDetailPage({ params }: Props) {
  const [product, user] = await Promise.all([
    getStandardProductById(params.productId),
    getSessionUser(),
  ]);

  if (!product) {
    notFound();
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
