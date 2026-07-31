import Link from "next/link";
import Image from "next/image";

export type AlternativeItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  reason: string;
};

type AlternativesRowProps = {
  alternatives: AlternativeItem[];
  showSection: boolean;
};

function formatPrice(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

export default function AlternativesRow({
  alternatives,
  showSection,
}: AlternativesRowProps) {
  if (!showSection) return null;

  return (
    <div className="px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
            Similar alternatives
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            {alternatives.length > 0
              ? "In-stock options in a similar price range"
              : "Shown because availability or delivery confidence is low"}
          </p>
        </div>
        {alternatives.length > 0 && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
            {alternatives.length} found
          </span>
        )}
      </div>

      {/* Edge case E: no alternatives in price band */}
      {alternatives.length === 0 ? (
        <div
          id="alternatives-empty-state"
          className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-5 py-6 text-center"
        >
          <svg
            className="mx-auto mb-2 h-8 w-8 text-stone-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold text-stone-700">
            No close alternatives available right now
          </p>
          <p className="mt-1 text-xs text-stone-500">
            We couldn&apos;t find in-stock items in the same category within ±25% of this price.
          </p>
        </div>
      ) : (
        <div id="alternatives-list" className="space-y-2">
          {alternatives.map((alt) => (
            <Link
              key={alt.id}
              href={`/product/${alt.id}`}
              className="card-hover flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3 group"
            >
              {/* Thumbnail */}
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-stone-100">
                {alt.image ? (
                  <Image
                    src={alt.image}
                    alt={alt.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg className="h-5 w-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-sm font-semibold text-stone-900 group-hover:text-orange-800 transition-colors">
                  {alt.name}
                </p>
                <p className="text-xs text-stone-500">{alt.brand}</p>
                <p className="text-xs font-bold text-stone-800">{formatPrice(alt.price)}</p>
                <p className="text-[11px] text-stone-500 flex items-center gap-1">
                  <svg className="h-3 w-3 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {alt.reason}
                </p>
              </div>

              {/* Arrow */}
              <svg className="h-4 w-4 shrink-0 text-stone-400 group-hover:text-stone-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
