"use client";

import { useMemo, useState } from "react";
import ConfidencePanel from "@/components/ConfidencePanel";
import SizeSelector, { type VariantOption } from "@/components/SizeSelector";

type ProductDetailClientProps = {
  productId: string;
  variants: VariantOption[];
};

export default function ProductDetailClient({
  productId,
  variants,
}: ProductDetailClientProps) {
  const defaultSize = useMemo(() => {
    const firstInStock = variants.find((variant) => variant.stock > 0);
    return firstInStock?.size ?? variants[0]?.size ?? null;
  }, [variants]);

  const [selectedSize, setSelectedSize] = useState<string | null>(defaultSize);

  return (
    <div className="space-y-6">
      <SizeSelector
        variants={variants}
        selectedSize={selectedSize}
        onSizeChange={setSelectedSize}
      />
      <ConfidencePanel productId={productId} selectedSize={selectedSize} />
    </div>
  );
}
