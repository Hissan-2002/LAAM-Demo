"use client";

import { useState } from "react";

type DeliveryConfidenceBadgeProps = {
  confidence: "High" | "Medium" | "Low";
  reason: string;
};

const BADGE_CONFIG: Record<
  DeliveryConfidenceBadgeProps["confidence"],
  { bg: string; text: string; border: string; icon: string; dotColor: string }
> = {
  High: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    icon: "✓",
    dotColor: "bg-emerald-500",
  },
  Medium: {
    bg: "bg-amber-50",
    text: "text-amber-900",
    border: "border-amber-200",
    icon: "~",
    dotColor: "bg-amber-500",
  },
  Low: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    icon: "!",
    dotColor: "bg-rose-500",
  },
};

export default function DeliveryConfidenceBadge({
  confidence,
  reason,
}: DeliveryConfidenceBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const config = BADGE_CONFIG[confidence];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${config.bg} ${config.text} ${config.border} ${confidence === "Low" ? "badge-low-pulse" : ""}`}
        >
          <span
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-black ${config.dotColor} text-white`}
          >
            {config.icon}
          </span>
          {confidence} confidence
        </span>

        {/* Why? toggle */}
        <button
          type="button"
          id="delivery-confidence-why-btn"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
          aria-expanded={expanded}
          aria-controls="confidence-reason-panel"
        >
          <svg
            className={`h-3 w-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Why?
        </button>
      </div>

      {/* Reason panel */}
      {expanded ? (
        <div
          id="confidence-reason-panel"
          role="region"
          aria-label="Delivery confidence explanation"
          className={`panel-enter rounded-lg border px-4 py-3 text-sm ${config.bg} ${config.border}`}
        >
          <p className={`font-medium ${config.text}`}>{reason}</p>
          {confidence === "Low" && (
            <p className="mt-1.5 text-xs text-stone-500">
              We surface alternatives below so you have better options.
            </p>
          )}
          {confidence === "Medium" && reason.includes("limited") && (
            <p className="mt-1.5 text-xs text-stone-500">
              We&#39;re transparent about uncertainty and avoid assigning a score without sufficient data.
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-stone-400 italic">
          Click &#34;Why?&#34; to see how we computed this rating from seller history.
        </p>
      )}
    </div>
  );
}
