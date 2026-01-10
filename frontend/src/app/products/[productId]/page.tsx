import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSessionUser, getStandardProductById, getStandardProducts, getProductReviews } from "@/lib/queries";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { ProductDetailLoader } from "@/components/ProductDetailLoader";
import { SiteTopNav } from "@/components/SiteTopNav";
import { formatMinis } from "@/lib/minis";

type SearchParams = Record<string, string | string[] | undefined>;

interface Props {
  params: Promise<{ productId: string }>;
  searchParams?: Promise<SearchParams>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const resolvedParams = await params;
  const productId = resolvedParams.productId;
  const product = await getStandardProductById(productId);
  if (!product) {
    return {
      title: "Product not found — Waashop",
      description: "This product is no longer available.",
    };
  }
  const description = product.description
    ? product.description.slice(0, 140)
    : `Shop ${product.name} on Waashop.`;
  const image = product.imageUrls?.[0] || product.imageUrl;
  return {
    title: `${product.name} — Waashop`,
    description,
    openGraph: {
      title: `${product.name} — Waashop`,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${product.name} — Waashop`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const productId = resolvedParams.productId;
  const [directProduct, user, allProducts, reviewData] = await Promise.all([
    getStandardProductById(productId),
    getSessionUser(),
    getStandardProducts(),
    getProductReviews(productId),
  ]);
  const product =
    directProduct ??
    allProducts.find((item) => item.id === productId) ??
    null;
  const relatedProducts = product
    ? allProducts
        .filter((item) => item.id !== product.id)
        .filter((item) => (product.vendorName ? item.vendorName === product.vendorName : true))
        .slice(0, 6)
    : [];
  const productJsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || undefined,
        image: product.imageUrls?.length
          ? product.imageUrls
          : product.imageUrl
            ? [product.imageUrl]
            : undefined,
        brand: product.vendorName
          ? {
              "@type": "Brand",
              name: product.vendorName,
            }
          : undefined,
        offers: {
          "@type": "Offer",
          priceCurrency: "MINIS",
          price: product.priceMinis,
          availability: "https://schema.org/InStock",
        },
      }
    : null;

  return (
    <div className="space-y-6 pb-10">
      <SiteTopNav signedIn={Boolean(user)} />
      <Link
        href="/shop?tab=products"
        className="text-sm text-[color:var(--app-text-muted)] hover:text-[color:var(--app-text)]"
      >
        ← Back to products
      </Link>
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      {product ? (
        <ProductDetailClient
          product={product}
          signedIn={Boolean(user)}
          reviews={reviewData.reviews}
          reviewSummary={reviewData.summary}
        />
      ) : (
        <ProductDetailLoader productId={productId} signedIn={Boolean(user)} />
      )}
      {product && relatedProducts.length > 0 && (
        <section className="web-panel rounded-3xl p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="web-kicker">
                {product.vendorName ? `More from ${product.vendorName}` : "More products"}
              </p>
              <h2 className="web-title">Explore similar picks</h2>
            </div>
            <Link href="/shop?tab=products" className="text-sm text-[color:var(--app-text-muted)] hover:opacity-80">
              View all products
            </Link>
          </div>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-3">
            {relatedProducts.map((item) => {
              const imageSrc = item.imageUrls?.[0] || item.imageUrl || "/images/no-image.svg";
              return (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  className="web-card group flex min-w-[220px] flex-col gap-3 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative h-32 w-full overflow-hidden rounded-xl border border-[color:var(--app-border)] bg-[color:var(--surface-bg)]">
                    <Image src={imageSrc} alt={item.name} fill className="object-cover" sizes="220px" unoptimized />
                  </div>
                  <div>
                    <p className="web-kicker">Product</p>
                    <p className="mt-2 text-lg font-semibold text-[color:var(--app-text)]">{item.name}</p>
                    {item.vendorCity && (
                      <p className="mt-1 text-xs text-[color:var(--app-text-muted)]">{item.vendorCity}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[color:var(--app-text-muted)]">
                    <span>Price</span>
                    <span className="web-chip px-3 py-1 text-xs font-semibold">
                      {formatMinis(item.priceMinis)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
