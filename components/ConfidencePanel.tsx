"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AlternativesRow, { type AlternativeItem } from "@/components/AlternativesRow";
import DeliveryConfidenceBadge from "@/components/DeliveryConfidenceBadge";
import { shouldShowAlternatives } from "@/lib/confidence";

type ConfidenceResponse = {
  availability: { inStock: boolean; stock: number };
  price: {
    base: number;
    final: number;
    discountPct: number | null;
    discountExpiresAt: string | null;
    urgentExpiry: boolean;
  };
  delivery: {
    estimatedDays: string;
    confidence: "High" | "Medium" | "Low";
    reason: string;
  };
  alternatives: AlternativeItem[];
};

type ConfidencePanelProps = {
  productId: string;
  selectedSize: string | null;
};

function formatPrice(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

/** Returns time remaining as a human string; returns null if expired or no expiry. */
function formatExpiryCountdown(expiresAt: string): string | null {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return null;
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) return `${Math.ceil(hours / 24)}d`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function SkeletonPanel() {
  return (
    <div className="space-y-5 p-5" aria-live="polite" aria-busy="true" aria-label="Loading confidence data">
      {[80, 60, 90].map((w) => (
        <div key={w} className="space-y-2">
          <div className={`skeleton h-3 w-${w > 70 ? "20" : "24"} rounded`} />
          <div className="skeleton h-5 w-full rounded" />
        </div>
      ))}
    </div>
  );
}

function AvailabilityRow({ inStock, stock, selectedSize }: { inStock: boolean; stock: number; selectedSize: string }) {
  if (inStock) {
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-3 w-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-700">In stock ({selectedSize})</p>
          <p className="text-xs text-stone-500">{stock} unit{stock !== 1 ? "s" : ""} available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100">
        <svg className="h-3 w-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-rose-700">Out of stock ({selectedSize})</p>
        <p className="text-xs text-stone-500">See alternatives below for in-stock options</p>
      </div>
    </div>
  );
}

export default function ConfidencePanel({
  productId,
  selectedSize,
}: ConfidencePanelProps) {
  const [data, setData] = useState<ConfidenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchConfidence = useCallback(async () => {
    if (!selectedSize) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/products/${productId}/confidence?size=${encodeURIComponent(selectedSize)}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load confidence data");
      }

      const payload = (await response.json()) as ConfidenceResponse;
      setData(payload);
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === "AbortError") return;
      setData(null);
      setError(
        fetchError instanceof Error ? fetchError.message : "Failed to load confidence data"
      );
    } finally {
      setLoading(false);
    }
  }, [productId, selectedSize]);

  useEffect(() => {
    void fetchConfidence();
    return () => abortRef.current?.abort();
  }, [fetchConfidence]);

  if (!selectedSize) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
            <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Purchase confidence</h2>
            <p className="text-xs text-stone-500">Select a size to check availability, final price, and delivery trust</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      {/* Panel header */}
      <div className="border-b border-stone-100 bg-stone-50 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-sm font-semibold text-stone-800">Purchase confidence</h2>
        </div>
        <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600 uppercase tracking-wide">
          Size {selectedSize}
        </span>
      </div>

      {/* Loading state */}
      {loading ? <SkeletonPanel /> : null}

      {/* Error state */}
      {!loading && error ? (
        <div className="p-5">
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm font-medium text-rose-800">{error}</p>
            <button
              type="button"
              id="confidence-retry-btn"
              onClick={() => void fetchConfidence()}
              className="mt-2 text-xs font-semibold text-rose-900 underline underline-offset-2 hover:text-rose-700"
            >
              Try again
            </button>
          </div>
        </div>
      ) : null}

      {/* Data state */}
      {!loading && !error && data ? (
        <div className="divide-y divide-stone-100 panel-enter">
          {/* Availability */}
          <div className="px-5 py-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
              Availability
            </p>
            <AvailabilityRow
              inStock={data.availability.inStock}
              stock={data.availability.stock}
              selectedSize={selectedSize}
            />
          </div>

          {/* Price */}
          <div className="px-5 py-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
              Final price
            </p>
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-2xl font-bold text-stone-900">
                {formatPrice(data.price.final)}
              </p>
              {data.price.discountPct ? (
                <>
                  <p className="text-sm text-stone-400 line-through">
                    {formatPrice(data.price.base)}
                  </p>
                  <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                    {data.price.discountPct}% off
                  </span>
                </>
              ) : null}
            </div>

            {/* Urgency banner (edge case B) */}
            {data.price.urgentExpiry && data.price.discountExpiresAt ? (
              <div
                id="discount-urgency-banner"
                className="urgency-blink mt-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2"
              >
                <svg className="h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-bold text-amber-900">
                  Discount ends today
                  {formatExpiryCountdown(data.price.discountExpiresAt)
                    ? ` (${formatExpiryCountdown(data.price.discountExpiresAt)} left)`
                    : ""}
                </p>
              </div>
            ) : null}
          </div>

          {/* Delivery */}
          <div className="px-5 py-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
              Delivery trust
            </p>
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <p className="text-sm text-stone-700">
                Estimated delivery:{" "}
                <strong className="text-stone-900">{data.delivery.estimatedDays}</strong>
              </p>
            </div>
            <DeliveryConfidenceBadge
              confidence={data.delivery.confidence}
              reason={data.delivery.reason}
            />
          </div>

          {/* Alternatives (edge cases A, C, E) */}
          <AlternativesRow
            alternatives={data.alternatives}
            showSection={shouldShowAlternatives(
              data.availability.inStock,
              data.delivery.confidence
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
