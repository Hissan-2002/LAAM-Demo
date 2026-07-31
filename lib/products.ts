import { prisma } from "@/lib/prisma";

export function parseImages(imagesJson: string): string[] {
  try {
    const parsed = JSON.parse(imagesJson) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function hasActiveDiscount(
  discountPct: number | null | undefined,
  discountExpiresAt: Date | null | undefined,
  now: Date = new Date()
): boolean {
  return (
    discountPct != null &&
    discountPct > 0 &&
    (discountExpiresAt == null || discountExpiresAt.getTime() > now.getTime())
  );
}

export async function getProductListing() {
  const products = await prisma.product.findMany({
    include: { priceRule: true },
    orderBy: { createdAt: "asc" },
  });

  return products.map((product) => {
    const images = parseImages(product.images);
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      basePrice: product.basePrice,
      category: product.category,
      image: images[0] ?? "",
      hasDiscount: hasActiveDiscount(
        product.priceRule?.discountPct,
        product.priceRule?.discountExpiresAt
      ),
    };
  });
}

export async function getProductDetail(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { size: "asc" } },
      priceRule: true,
      seller: true,
    },
  });

  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    category: product.category,
    basePrice: product.basePrice,
    images: parseImages(product.images),
    seller: { id: product.seller.id, name: product.seller.name },
    variants: product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      stock: variant.stock,
      sku: variant.sku,
    })),
    priceRule: product.priceRule
      ? {
          discountPct: product.priceRule.discountPct,
          discountExpiresAt:
            product.priceRule.discountExpiresAt?.toISOString() ?? null,
        }
      : null,
  };
}

export async function getCatalogSnapshot() {
  return prisma.product.findMany({
    include: { variants: true },
  });
}
