import Link from "next/link";
import Image from "next/image";

type ProductCardProps = {
  id: string;
  name: string;
  brand: string;
  basePrice: number;
  category: string;
  image: string;
  hasDiscount: boolean;
};

function formatPrice(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export default function ProductCard({
  id,
  name,
  brand,
  basePrice,
  category,
  image,
  hasDiscount,
}: ProductCardProps) {
  return (
    <Link
      href={`/product/${id}`}
      className="card-hover group block overflow-hidden rounded-xl border border-stone-200 bg-white"
    >
      {/* Image container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-stone-400">
            <svg className="h-12 w-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span className="rounded-md bg-rose-600 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
              Sale
            </span>
          )}
        </div>

        {/* "View product" pill on hover */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="whitespace-nowrap rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-stone-800 shadow backdrop-blur-sm">
            View product →
          </span>
        </div>
      </div>

      {/* Product info */}
      <div className="space-y-1 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
          {category}
        </p>
        <h2 className="text-sm font-semibold text-stone-900 leading-snug group-hover:text-orange-800 transition-colors">
          {name}
        </h2>
        <p className="text-xs text-stone-500">{brand}</p>
        <div className="pt-1 flex items-center gap-2">
          <p className="text-sm font-bold text-stone-900">{formatPrice(basePrice)}</p>
          {hasDiscount && (
            <span className="text-[10px] font-medium text-rose-600 bg-rose-50 rounded px-1.5 py-0.5">
              Discount active
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
