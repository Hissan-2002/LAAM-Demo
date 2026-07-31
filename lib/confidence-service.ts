import {
  computeDeliveryConfidence,
  computeFinalPrice,
  findAlternatives,
  formatEstimatedDays,
  shouldShowAlternatives,
  type CatalogProduct,
} from "@/lib/confidence";
import {
  getCatalogSnapshot,
  getProductDetail,
  hasActiveDiscount,
} from "@/lib/products";
import { prisma } from "@/lib/prisma";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL"];

function sortVariants<T extends { size: string }>(variants: T[]): T[] {
  return [...variants].sort(
    (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)
  );
}

export async function getConfidencePayload(productId: string, size: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: true,
      priceRule: true,
      seller: {
        include: {
          deliveryLogs: {
            orderBy: { actualDate: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  if (!product) return null;

  const variant = product.variants.find((item) => item.size === size);
  if (!variant) {
    return { error: "invalid_size" as const };
  }

  const inStock = variant.stock > 0;
  const price = computeFinalPrice(
    product.basePrice,
    product.priceRule?.discountPct,
    product.priceRule?.discountExpiresAt
  );

  const deliveryConfidence = computeDeliveryConfidence(
    product.seller.deliveryLogs.map((log) => ({
      promisedDate: log.promisedDate,
      actualDate: log.actualDate,
    }))
  );

  const catalogRows = await getCatalogSnapshot();
  const catalog: CatalogProduct[] = catalogRows.map((row) => ({
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    basePrice: row.basePrice,
    images: row.images,
    variants: row.variants.map((item) => ({
      size: item.size,
      stock: item.stock,
    })),
  }));

  const currentProduct = catalog.find((item) => item.id === product.id);
  const alternatives =
    currentProduct == null
      ? []
      : findAlternatives(
          currentProduct,
          catalog,
          size,
          inStock,
          deliveryConfidence.label
        );

  return {
    availability: {
      inStock,
      stock: variant.stock,
    },
    price,
    delivery: {
      estimatedDays: formatEstimatedDays(
        product.seller.deliveryDaysMin,
        product.seller.deliveryDaysMax
      ),
      confidence: deliveryConfidence.label,
      reason: deliveryConfidence.reason,
    },
    alternatives,
    showAlternativesSection: shouldShowAlternatives(
      inStock,
      deliveryConfidence.label
    ),
  };
}

export { getProductDetail, sortVariants, hasActiveDiscount };
