import ProductCard from "@/components/ProductCard";
import { getProductListing } from "@/lib/products";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Arrivals | LAAM Purchase Confidence",
  description:
    "Browse 8 curated South Asian fashion products. Each product detail page shows explainable confidence signals for availability, price, and delivery.",
};

export default async function HomePage() {
  const products = await getProductListing();

  return (
    <div className="space-y-10">
      {/* Hero section */}
      <section className="space-y-4 border-b border-stone-200 pb-8">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-orange-700">
              New arrivals
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
              Shop with confidence
            </h1>
            <p className="text-base text-stone-500 leading-relaxed">
              Every product page shows explainable availability, final price, and delivery trust instead of just
              decorative badges.{" "}
              <span className="text-stone-700 font-medium">
                Select a size on any product to see why.
              </span>
            </p>
          </div>
          <div className="hidden lg:flex shrink-0 flex-col gap-2 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-stone-500">High confidence</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-xs text-stone-500">Medium confidence</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-xs text-stone-500">Low confidence</span>
            </div>
          </div>
        </div>

        {/* Edge-case legend */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { label: "OOS alternatives", color: "bg-rose-50 text-rose-700 border-rose-200" },
            { label: "Discount urgency", color: "bg-amber-50 text-amber-700 border-amber-200" },
            { label: "Low delivery trust", color: "bg-orange-50 text-orange-700 border-orange-200" },
            { label: "New seller", color: "bg-sky-50 text-sky-700 border-sky-200" },
          ].map(({ label, color }) => (
            <span
              key={label}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${color}`}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Product grid */}
      <section>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* Demo note */}
      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-stone-700">Edge cases to explore</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-stone-500">
          <li>• <strong className="text-stone-700">Embroidered Kurta</strong>: Select size M to see out-of-stock alternatives</li>
          <li>• <strong className="text-stone-700">Silk Saree</strong>: Discount expiring within 24 hours (urgency banner)</li>
          <li>• <strong className="text-stone-700">Bridal / Party Lehenga</strong>: Low delivery confidence triggers alternatives even when in stock</li>
          <li>• <strong className="text-stone-700">Block-Print Kurta</strong>: New seller with no delivery history (honest Medium)</li>
          <li>• <strong className="text-stone-700">Designer Lehenga Set</strong>: Select L or XL for explicit "no alternatives" empty state</li>
          <li>• <strong className="text-stone-700">Casual Cotton Kurta</strong>: Mixed per-size stock reflected in size selector</li>
        </ul>
      </section>
    </div>
  );
}
