import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SIZES = ["XS", "S", "M", "L", "XL"] as const;

function images(urls: string[]): string {
  return JSON.stringify(urls);
}

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function hoursFromNow(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

/**
 * Creates a delivery log entry.
 *
 * Semantics:
 *   promisedDaysAgo: how many days ago the delivery was *promised* (the deadline)
 *   actualDaysAgo:   how many days ago the delivery actually arrived
 *
 * On-time = actualDate <= promisedDate in calendar terms
 *          = (now - actualDaysAgo) <= (now - promisedDaysAgo)
 *          = actualDaysAgo >= promisedDaysAgo
 *
 * So to record an ON-TIME delivery:  actualDaysAgo >= promisedDaysAgo
 *    to record a    LATE delivery:   actualDaysAgo <  promisedDaysAgo
 */
function deliveryLog(
  sellerId: string,
  promisedDaysAgo: number,
  actualDaysAgo: number
) {
  const promisedDate = daysFromNow(-promisedDaysAgo);
  const actualDate = daysFromNow(-actualDaysAgo);
  return { sellerId, promisedDate, actualDate };
}

async function main() {
  // Clear in dependency order
  await prisma.deliveryLog.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.priceRule.deleteMany();
  await prisma.product.deleteMany();
  await prisma.seller.deleteMany();

  // ── Sellers ─────────────────────────────────────────────────────────────────

  const reliableBoutique = await prisma.seller.create({
    data: {
      id: "seller-reliable",
      name: "ReliableBoutique",
      deliveryDaysMin: 3,
      deliveryDaysMax: 5,
    },
  });

  const heritageCrafts = await prisma.seller.create({
    data: {
      id: "seller-heritage",
      name: "HeritageCrafts",
      deliveryDaysMin: 4,
      deliveryDaysMax: 6,
    },
  });

  const quickFashion = await prisma.seller.create({
    data: {
      id: "seller-quick",
      name: "QuickFashion",
      deliveryDaysMin: 2,
      deliveryDaysMax: 4,
    },
  });

  // Edge case D: NewArrivals has zero delivery logs -> Medium + honest reason
  const newArrivals = await prisma.seller.create({
    data: {
      id: "seller-new",
      name: "NewArrivals",
      deliveryDaysMin: 3,
      deliveryDaysMax: 5,
    },
  });

  // ── Delivery Logs ────────────────────────────────────────────────────────────
  //
  // Linear recency weights (newest first): [5, 4, 3, 2, 1] → Σ=15
  //
  // ReliableBoutique target: High confidence (weighted on-time ≥ 0.80)
  //   All 5 on time → weighted score = 15/15 = 1.00 → High
  //   Logs sorted newest-first by actualDate; we use larger actualDaysAgo for older entries.
  //   on-time = actualDaysAgo >= promisedDaysAgo
  //
  // HeritageCrafts target: Medium confidence (0.40 ≤ score < 0.80)
  //   Recent 2 late, older 3 on-time → weighted on-time = 3+2+1 = 6 (indexes 2,3,4)
  //   score = (1×6 + 2×5) / 15 ... let's do: on-time at positions 0,1,2 (newest), late at 3,4
  //   positions newest=weight5, ..., oldest=weight1
  //   on-time at weights 5,4,3 -> weighted on-time = 5+4+3=12, total=15, score=0.80 (High - too high)
  //   Use: 3 late recent, 2 on-time old: score = (1+2)/15 = 3/15 = 0.20 (Low... hmm)
  //   score = 6/15 = 0.40 → Medium boundary
  //   Use: 3 late recent, 2 on-time old - score = (1+2)/15 = 3/15 = 0.20 → Low... hmm
  //   Target exactly Medium: 3 on-time, 2 late, positioned for score in [0.40, 0.80)
  //   Mixed = 3 on-time (positions 0,2,4 = weights 5,3,1=9), 2 late (positions 1,3 = weights 4,2=6)
  //   score = 9/15 = 0.60 → Medium ✓
  //
  // QuickFashion target: Low confidence (score < 0.40)
  //   1 on-time (oldest only), 4 late (most recent) → weighted on-time = 1/15 → Low ✓

  await prisma.deliveryLog.createMany({
    data: [
      // ReliableBoutique: all 5 on-time (actualDaysAgo >= promisedDaysAgo)
      // Newest first by actual date (smaller actualDaysAgo = more recent)
      deliveryLog(reliableBoutique.id, 4, 5),   // promised 4 days ago, arrived 5 days ago (ON TIME ✓)
      deliveryLog(reliableBoutique.id, 10, 12),  // ON TIME ✓
      deliveryLog(reliableBoutique.id, 19, 21),  // ON TIME ✓
      deliveryLog(reliableBoutique.id, 27, 29),  // ON TIME ✓
      deliveryLog(reliableBoutique.id, 34, 36),  // ON TIME ✓

      // HeritageCrafts: mixed: on-time at positions 0,2,4 (weights 5,3,1); late at 1,3 (weights 4,2)
      // sorted newest-first by actualDate:
      //   pos 0 (newest, actualDaysAgo≈5):  ON TIME  → weight 5
      //   pos 1 (actualDaysAgo≈12):          LATE     → weight 4
      //   pos 2 (actualDaysAgo≈20):          ON TIME  → weight 3
      //   pos 3 (actualDaysAgo≈28):          LATE     → weight 2
      //   pos 4 (actualDaysAgo≈36):          ON TIME  → weight 1
      // score = (5+3+1)/15 = 9/15 = 0.60 → Medium ✓
      deliveryLog(heritageCrafts.id, 4, 5),    // pos 0: ON TIME (actual 5d ago, promised 4d ago) ✓
      deliveryLog(heritageCrafts.id, 14, 12),  // pos 1: LATE (actual 12d ago, promised 14d ago) ✗
      deliveryLog(heritageCrafts.id, 18, 20),  // pos 2: ON TIME ✓
      deliveryLog(heritageCrafts.id, 30, 28),  // pos 3: LATE ✗
      deliveryLog(heritageCrafts.id, 34, 36),  // pos 4: ON TIME ✓

      // QuickFashion: 1 on-time (oldest only), 4 late (weights 5,4,3,2); on-time weight 1
      // score = 1/15 ≈ 0.067 → Low ✓
      deliveryLog(quickFashion.id, 6, 4),    // pos 0: LATE (actual 4d ago, promised 6d ago) ✗
      deliveryLog(quickFashion.id, 14, 10),  // pos 1: LATE ✗
      deliveryLog(quickFashion.id, 22, 18),  // pos 2: LATE ✗
      deliveryLog(quickFashion.id, 28, 26),  // pos 3: LATE ✗
      deliveryLog(quickFashion.id, 34, 36),  // pos 4: ON TIME ✓ (old, lowest weight)
    ],
  });

  // NewArrivals: zero logs (edge case D handled above, no createMany call)

  // ── Products ─────────────────────────────────────────────────────────────────
  //
  // Images: Picsum Photos with stable integer seeds + fashion-appropriate dimensions.
  // These URLs are reliable and load without CORS or auth issues.

  type ProductSeed = {
    slug: string;
    edgeCase: string;
    name: string;
    brand: string;
    category: string;
    basePrice: number;
    sellerId: string;
    images: string[];
    stockBySize: Partial<Record<(typeof SIZES)[number], number>>;
    priceRule?: { discountPct: number; discountExpiresAt: Date };
  };

  const products: ProductSeed[] = [
    {
      // Edge case A: size M is out of stock -> confidence panel shows OOS + alternatives
      slug: "embroidered-kurta",
      edgeCase: "A: selected size M OOS triggers alternatives",
      name: "Embroidered Kurta",
      brand: "Gul Ahmed",
      category: "Kurtas",
      basePrice: 4500,
      sellerId: reliableBoutique.id, // High confidence seller
      images: [
        "https://picsum.photos/seed/kurta-emb/800/1000",
      ],
      stockBySize: { XS: 2, S: 4, M: 0, L: 3, XL: 1 },
    },
    {
      // Edge case B: discount expires within 24 hours -> urgency banner in UI
      slug: "silk-saree",
      edgeCase: "B: discount expiring within 24 hours shows urgency",
      name: "Silk Saree",
      brand: "Khaadi",
      category: "Sarees",
      basePrice: 8900,
      sellerId: reliableBoutique.id, // High confidence seller
      images: [
        "https://picsum.photos/seed/saree-silk/800/1000",
      ],
      stockBySize: { XS: 1, S: 2, M: 3, L: 2, XL: 1 },
      priceRule: { discountPct: 20, discountExpiresAt: hoursFromNow(10) },
    },
    {
      // Edge case C: QuickFashion seller -> Low confidence, alternatives shown even though in stock
      slug: "bridal-lehenga",
      edgeCase: "C: Low delivery confidence (QuickFashion), alternatives shown while in stock",
      name: "Bridal Lehenga",
      brand: "Maria B",
      category: "Lehengas",
      basePrice: 32000,
      sellerId: quickFashion.id,
      images: [
        "https://picsum.photos/seed/lehenga-bridal/800/1000",
      ],
      stockBySize: { XS: 1, S: 2, M: 2, L: 1, XL: 1 },
    },
    {
      // Edge case C-alt: second product in similar price band for alternatives pool (Lehengas ~28k)
      slug: "party-lehenga",
      edgeCase: "C-alt: similar-price lehenga from reliable seller (alternatives pool for C)",
      name: "Party Lehenga",
      brand: "Sana Safinaz",
      category: "Lehengas",
      basePrice: 28000,
      sellerId: heritageCrafts.id, // Medium confidence (a reasonable alternative)
      images: [
        "https://picsum.photos/seed/lehenga-party/800/1000",
      ],
      stockBySize: { XS: 2, S: 3, M: 4, L: 2, XL: 1 },
    },
    {
      // Edge case D: NewArrivals seller has zero delivery logs -> Medium + "limited history" reason
      slug: "block-print-kurta",
      edgeCase: "D: zero delivery logs (NewArrivals) -> Medium confidence, honest reason",
      name: "Block-Print Kurta",
      brand: "Cross Stitch",
      category: "Kurtas",
      basePrice: 3800,
      sellerId: newArrivals.id,
      images: [
        "https://picsum.photos/seed/kurta-block/800/1000",
      ],
      stockBySize: { XS: 1, S: 3, M: 5, L: 2, XL: 2 },
    },
    {
      // Edge case E: unique high price isolates this product outside ±25% of any peer lehenga
      // Selecting L or XL (OOS) triggers the alternatives section but finds nothing -> empty state
      slug: "designer-lehenga-set",
      edgeCase: "E: no alternatives in ±25% price band, explicit empty state shown",
      name: "Designer Lehenga Set",
      brand: "Elan",
      category: "Lehengas",
      basePrice: 85000,
      sellerId: heritageCrafts.id,
      images: [
        "https://picsum.photos/seed/lehenga-designer/800/1000",
      ],
      // L and XL out of stock -> selecting them triggers alternatives, but none match ±25% of 85000
      stockBySize: { XS: 1, S: 1, M: 1, L: 0, XL: 0 },
    },
    {
      // Edge case F: mixed per-size stock; size selector shows each size state individually
      slug: "casual-cotton-kurta",
      edgeCase: "F: mixed per-size stock (XS:0, S:3, M:8, L:0, XL:2)",
      name: "Casual Cotton Kurta",
      brand: "Outfitters",
      category: "Kurtas",
      basePrice: 3200,
      sellerId: heritageCrafts.id,
      images: [
        "https://picsum.photos/seed/kurta-cotton/800/1000",
      ],
      stockBySize: { XS: 0, S: 3, M: 8, L: 0, XL: 2 },
    },
    {
      // Happy path: High confidence seller, no discount, all sizes in stock, no alternatives
      slug: "festive-saree",
      edgeCase: "Happy path: High confidence, all sizes in stock, empty alternatives array",
      name: "Festive Saree",
      brand: "Nishat",
      category: "Sarees",
      basePrice: 6500,
      sellerId: reliableBoutique.id,
      images: [
        "https://picsum.photos/seed/saree-festive/800/1000",
      ],
      stockBySize: { XS: 2, S: 4, M: 5, L: 3, XL: 2 },
    },
  ];

  for (const productSeed of products) {
    console.log(`Seeding ${productSeed.name} (${productSeed.edgeCase})`);

    const product = await prisma.product.create({
      data: {
        name: productSeed.name,
        brand: productSeed.brand,
        category: productSeed.category,
        basePrice: productSeed.basePrice,
        images: images(productSeed.images),
        sellerId: productSeed.sellerId,
      },
    });

    await prisma.variant.createMany({
      data: SIZES.map((size) => ({
        productId: product.id,
        size,
        stock: productSeed.stockBySize[size] ?? 0,
        sku: `${productSeed.slug}-${size.toLowerCase()}`,
      })),
    });

    if (productSeed.priceRule) {
      await prisma.priceRule.create({
        data: {
          productId: product.id,
          discountPct: productSeed.priceRule.discountPct,
          discountExpiresAt: productSeed.priceRule.discountExpiresAt,
        },
      });
    }
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
