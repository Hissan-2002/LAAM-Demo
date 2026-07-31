import { describe, expect, it } from "vitest";
import {
  computeDeliveryConfidence,
  computeFinalPrice,
  findAlternatives,
  isOnTime,
  type CatalogProduct,
  type DeliveryLogInput,
} from "./confidence";

function makeLog(
  promisedOffsetDays: number,
  actualOffsetDays: number,
  baseDate = new Date("2025-01-01")
): DeliveryLogInput {
  const promisedDate = new Date(baseDate);
  promisedDate.setDate(promisedDate.getDate() + promisedOffsetDays);
  const actualDate = new Date(baseDate);
  actualDate.setDate(actualDate.getDate() + actualOffsetDays);
  return { promisedDate, actualDate };
}

describe("isOnTime", () => {
  it("returns true when actual is on or before promised date", () => {
    const log = makeLog(5, 4);
    expect(isOnTime(log)).toBe(true);
  });

  it("returns false when actual is after promised date", () => {
    const log = makeLog(5, 7);
    expect(isOnTime(log)).toBe(false);
  });
});

describe("computeDeliveryConfidence", () => {
  it("returns High confidence for mostly on-time recent deliveries", () => {
    const logs = [
      makeLog(10, 9),
      makeLog(8, 8),
      makeLog(6, 5),
      makeLog(4, 6),
      makeLog(2, 1),
    ];

    const result = computeDeliveryConfidence(logs);

    expect(result.label).toBe("High");
    expect(result.reason).toContain("4 of the last 5");
    expect(result.score).toBeGreaterThanOrEqual(0.8);
  });

  it("returns Low confidence for mostly late recent deliveries", () => {
    const logs = [
      makeLog(10, 14),
      makeLog(8, 12),
      makeLog(6, 9),
      makeLog(4, 3),
      makeLog(2, 1),
    ];

    const result = computeDeliveryConfidence(logs);

    expect(result.label).toBe("Low");
    expect(result.reason).toContain("2 of the last 5");
    expect(result.score).toBeLessThan(0.4);
  });

  it("returns Medium confidence for mixed delivery history", () => {
    const logs = [
      makeLog(10, 9),
      makeLog(8, 11),
      makeLog(6, 5),
      makeLog(4, 7),
      makeLog(2, 2),
    ];

    const result = computeDeliveryConfidence(logs);

    expect(result.label).toBe("Medium");
    expect(result.score).toBeGreaterThanOrEqual(0.4);
    expect(result.score).toBeLessThan(0.8);
  });

  it("returns Medium with honest reason when seller has zero history", () => {
    const result = computeDeliveryConfidence([]);

    expect(result.label).toBe("Medium");
    expect(result.reason).toBe(
      "New seller: limited delivery history available"
    );
    expect(result.score).toBeNull();
  });

  it("weights recent deliveries more heavily than older ones", () => {
    const recentGood = [
      makeLog(10, 9),
      makeLog(8, 8),
      makeLog(6, 5),
      makeLog(4, 8),
      makeLog(2, 9),
    ];

    const recentBad = [
      makeLog(10, 12),
      makeLog(8, 11),
      makeLog(6, 9),
      makeLog(4, 3),
      makeLog(2, 1),
    ];

    const goodRecentResult = computeDeliveryConfidence(recentGood);
    const badRecentResult = computeDeliveryConfidence(recentBad);

    expect(goodRecentResult.score).not.toBeNull();
    expect(badRecentResult.score).not.toBeNull();
    expect(goodRecentResult.score!).toBeGreaterThan(badRecentResult.score!);
    expect(goodRecentResult.label).toBe("Medium");
    expect(badRecentResult.label).toBe("Low");
  });
});

describe("computeFinalPrice", () => {
  it("marks discounts expiring within 24 hours as urgent", () => {
    const now = new Date("2025-06-01T12:00:00.000Z");
    const expiresAt = new Date("2025-06-02T08:00:00.000Z");

    const result = computeFinalPrice(5000, 20, expiresAt, now);

    expect(result.final).toBe(4000);
    expect(result.urgentExpiry).toBe(true);
    expect(result.discountPct).toBe(20);
  });

  it("returns base price when discount is expired", () => {
    const now = new Date("2025-06-03T12:00:00.000Z");
    const expiresAt = new Date("2025-06-02T08:00:00.000Z");

    const result = computeFinalPrice(5000, 20, expiresAt, now);

    expect(result.final).toBe(5000);
    expect(result.discountPct).toBeNull();
    expect(result.urgentExpiry).toBe(false);
  });
});

describe("findAlternatives", () => {
  const catalog: CatalogProduct[] = [
    {
      id: "current",
      name: "Current Kurta",
      brand: "LAAM",
      category: "Kurtas",
      basePrice: 4000,
      images: '["https://example.com/current.jpg"]',
      variants: [{ size: "M", stock: 0 }],
    },
    {
      id: "alt-1",
      name: "Alt Kurta 1",
      brand: "Brand A",
      category: "Kurtas",
      basePrice: 4200,
      images: '["https://example.com/alt1.jpg"]',
      variants: [{ size: "M", stock: 3 }],
    },
    {
      id: "alt-2",
      name: "Alt Kurta 2",
      brand: "Brand B",
      category: "Kurtas",
      basePrice: 3800,
      images: '["https://example.com/alt2.jpg"]',
      variants: [{ size: "S", stock: 2 }],
    },
    {
      id: "expensive",
      name: "Expensive Kurta",
      brand: "Brand C",
      category: "Kurtas",
      basePrice: 9000,
      images: '["https://example.com/exp.jpg"]',
      variants: [{ size: "M", stock: 1 }],
    },
  ];

  it("returns alternatives when selected size is out of stock", () => {
    const alternatives = findAlternatives(
      catalog[0],
      catalog,
      "M",
      false,
      "High"
    );

    expect(alternatives).toHaveLength(2);
    expect(alternatives.map((alt) => alt.id).sort()).toEqual(["alt-1", "alt-2"]);
  });

  it("returns alternatives when delivery confidence is Low even if in stock", () => {
    const inStockProduct = {
      ...catalog[0],
      variants: [{ size: "M", stock: 5 }],
    };

    const alternatives = findAlternatives(
      inStockProduct,
      catalog,
      "M",
      true,
      "Low"
    );

    expect(alternatives.length).toBeGreaterThan(0);
  });

  it("returns empty array for confident in-stock purchases", () => {
    const inStockProduct = {
      ...catalog[0],
      variants: [{ size: "M", stock: 5 }],
    };

    const alternatives = findAlternatives(
      inStockProduct,
      catalog,
      "M",
      true,
      "High"
    );

    expect(alternatives).toEqual([]);
  });
});
