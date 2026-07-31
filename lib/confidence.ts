export type DeliveryLogInput = {
  promisedDate: Date;
  actualDate: Date;
};

export type ConfidenceLabel = "High" | "Medium" | "Low";

export type ConfidenceResult = {
  label: ConfidenceLabel;
  reason: string;
  score: number | null;
};

export type PriceResult = {
  base: number;
  final: number;
  discountPct: number | null;
  discountExpiresAt: string | null;
  urgentExpiry: boolean;
};

export type CatalogProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  basePrice: number;
  images: string;
  variants: Array<{ size: string; stock: number }>;
};

export type Alternative = {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  reason: string;
};

export const RECENT_DELIVERY_COUNT = 5;
export const URGENT_EXPIRY_MS = 24 * 60 * 60 * 1000;
export const PRICE_BAND_TOLERANCE = 0.25;

export function isOnTime(log: DeliveryLogInput): boolean {
  return log.actualDate.getTime() <= log.promisedDate.getTime();
}

function sortLogsNewestFirst(logs: DeliveryLogInput[]): DeliveryLogInput[] {
  return [...logs].sort(
    (a, b) => b.actualDate.getTime() - a.actualDate.getTime()
  );
}

function mapScoreToLabel(score: number): ConfidenceLabel {
  if (score >= 0.8) return "High";
  if (score >= 0.4) return "Medium";
  return "Low";
}

export function computeDeliveryConfidence(
  logs: DeliveryLogInput[],
  recentN: number = RECENT_DELIVERY_COUNT
): ConfidenceResult {
  if (logs.length === 0) {
    return {
      label: "Medium",
      reason: "New seller: limited delivery history available",
      score: null,
    };
  }

  const recentLogs = sortLogsNewestFirst(logs).slice(0, recentN);
  const total = recentLogs.length;

  let weightedOnTimeSum = 0;
  let weightSum = 0;
  let onTimeCount = 0;

  recentLogs.forEach((log, index) => {
    const weight = total - index;
    const onTime = isOnTime(log) ? 1 : 0;
    weightedOnTimeSum += weight * onTime;
    weightSum += weight;
    onTimeCount += onTime;
  });

  const score = weightSum === 0 ? 0 : weightedOnTimeSum / weightSum;
  const label = mapScoreToLabel(score);
  const reason = `${onTimeCount} of the last ${total} orders from this seller arrived on or before the promised date`;

  return { label, reason, score };
}

export function computeFinalPrice(
  basePrice: number,
  discountPct: number | null | undefined,
  discountExpiresAt: Date | null | undefined,
  now: Date = new Date()
): PriceResult {
  const hasActiveDiscount =
    discountPct != null &&
    discountPct > 0 &&
    (discountExpiresAt == null || discountExpiresAt.getTime() > now.getTime());

  if (!hasActiveDiscount) {
    return {
      base: basePrice,
      final: basePrice,
      discountPct: null,
      discountExpiresAt: null,
      urgentExpiry: false,
    };
  }

  const final = Math.round(basePrice * (1 - discountPct / 100));
  const urgentExpiry =
    discountExpiresAt != null &&
    discountExpiresAt.getTime() > now.getTime() &&
    discountExpiresAt.getTime() - now.getTime() <= URGENT_EXPIRY_MS;

  return {
    base: basePrice,
    final,
    discountPct,
    discountExpiresAt: discountExpiresAt?.toISOString() ?? null,
    urgentExpiry,
  };
}

function parseFirstImage(imagesJson: string): string {
  try {
    const images = JSON.parse(imagesJson) as string[];
    return images[0] ?? "";
  } catch {
    return "";
  }
}

function hasStockForSize(
  variants: Array<{ size: string; stock: number }>,
  size: string
): boolean {
  return variants.some((variant) => variant.size === size && variant.stock > 0);
}

function buildAlternativeReason(
  selectedSize: string,
  hasSelectedSize: boolean
): string {
  if (hasSelectedSize) {
    return `Similar style, in stock in your size (${selectedSize})`;
  }
  return "Same category, in stock now";
}

export function shouldShowAlternatives(
  inStock: boolean,
  deliveryConfidence: ConfidenceLabel
): boolean {
  return !inStock || deliveryConfidence === "Low";
}

export function findAlternatives(
  currentProduct: CatalogProduct,
  catalog: CatalogProduct[],
  selectedSize: string,
  inStock: boolean,
  deliveryConfidence: ConfidenceLabel,
  maxResults: number = 3
): Alternative[] {
  if (!shouldShowAlternatives(inStock, deliveryConfidence)) {
    return [];
  }

  const minPrice = currentProduct.basePrice * (1 - PRICE_BAND_TOLERANCE);
  const maxPrice = currentProduct.basePrice * (1 + PRICE_BAND_TOLERANCE);

  return catalog
    .filter((product) => {
      if (product.id === currentProduct.id) return false;
      if (product.category !== currentProduct.category) return false;
      if (product.basePrice < minPrice || product.basePrice > maxPrice) {
        return false;
      }
      return product.variants.some((variant) => variant.stock > 0);
    })
    .sort(
      (a, b) =>
        Math.abs(a.basePrice - currentProduct.basePrice) -
        Math.abs(b.basePrice - currentProduct.basePrice)
    )
    .slice(0, maxResults)
    .map((product) => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.basePrice,
      image: parseFirstImage(product.images),
      reason: buildAlternativeReason(
        selectedSize,
        hasStockForSize(product.variants, selectedSize)
      ),
    }));
}

export function formatEstimatedDays(minDays: number, maxDays: number): string {
  if (minDays === maxDays) return `${minDays} days`;
  return `${minDays}–${maxDays} days`;
}
