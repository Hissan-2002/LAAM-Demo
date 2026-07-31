"use client";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL"];

export type VariantOption = {
  size: string;
  stock: number;
};

type SizeSelectorProps = {
  variants: VariantOption[];
  selectedSize: string | null;
  onSizeChange: (size: string) => void;
};

export default function SizeSelector({
  variants,
  selectedSize,
  onSizeChange,
}: SizeSelectorProps) {
  const sortedVariants = [...variants].sort(
    (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-800">Select size</h3>
        <p className="text-xs text-stone-400">
          Out-of-stock sizes remain selectable (check alternatives)
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {sortedVariants.map((variant) => {
          const isSelected = selectedSize === variant.size;
          const inStock = variant.stock > 0;

          return (
            <button
              key={variant.size}
              type="button"
              id={`size-btn-${variant.size}`}
              onClick={() => onSizeChange(variant.size)}
              aria-pressed={isSelected}
              aria-label={`Size ${variant.size}, ${inStock ? `${variant.stock} in stock` : "out of stock"}`}
              className={[
                "relative min-w-[3.5rem] rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                isSelected
                  ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                  : inStock
                  ? "border-stone-300 bg-white text-stone-800 hover:border-stone-500 hover:bg-stone-50"
                  : "border-dashed border-stone-300 bg-white text-stone-400 hover:border-stone-400",
              ].join(" ")}
            >
              <span className="block leading-none">{variant.size}</span>
              <span
                className={[
                  "mt-1 block text-[9px] font-medium uppercase tracking-wide leading-none",
                  isSelected
                    ? "text-white/70"
                    : inStock
                    ? "text-stone-400"
                    : "text-rose-400",
                ].join(" ")}
              >
                {inStock ? `${variant.stock}` : "OOS"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
