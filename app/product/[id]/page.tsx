import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/ProductDetailClient";
import { getProductDetail } from "@/lib/products";
import type { Metadata } from "next";

type ProductPageProps = {
  params: { id: string };
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductDetail(params.id);
  if (!product) return { title: "Product not found | LAAM" };
  return {
    title: `${product.name} by ${product.brand} | LAAM`,
    description: `Shop ${product.name} from ${product.brand} on LAAM. See explainable purchase confidence for availability, price, and delivery.`,
  };
}

function formatPrice(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductDetail(params.id);

  if (!product) {
    notFound();
  }

  const primaryImage = product.images[0];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-stone-500">
        <Link
          href="/"
          className="hover:text-stone-900 transition-colors"
        >
          ← New arrivals
        </Link>
        <span>/</span>
        <span className="text-stone-400">{product.category}</span>
        <span>/</span>
        <span className="text-stone-700 font-medium truncate max-w-[180px]">{product.name}</span>
      </nav>

      {/* PDP grid */}
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_0.9fr]">
        {/* ── Left: Product Image ─────────────────────────────── */}
        <div className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-stone-400">
                <svg className="h-16 w-16 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">No image available</span>
              </div>
            )}
          </div>

          {/* Image metadata strip */}
          <div className="flex items-center justify-between rounded-lg bg-stone-100 px-4 py-2.5 text-xs text-stone-500">
            <span>{product.category}</span>
            <span>Sold by <strong className="text-stone-700">{product.seller.name}</strong></span>
          </div>
        </div>

        {/* ── Right: Product Info + Confidence ────────────────── */}
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3 border-b border-stone-100 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-700">
              {product.brand}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-stone-900">
              {product.name}
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-bold text-stone-900">
                {formatPrice(product.basePrice)}
              </p>
              {product.priceRule?.discountPct ? (
                <span className="rounded-md bg-rose-100 px-2 py-0.5 text-sm font-semibold text-rose-700">
                  {product.priceRule.discountPct}% off
                </span>
              ) : null}
            </div>
            <p className="text-sm text-stone-500">
              Price shown before size selection. Select a size below to see the final price and purchase confidence.
            </p>
          </div>

          {/* Interactive client zone */}
          <ProductDetailClient
            productId={product.id}
            variants={product.variants.map((variant) => ({
              size: variant.size,
              stock: variant.stock,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
