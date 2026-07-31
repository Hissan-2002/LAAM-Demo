# LAAM Purchase Confidence

A focused full-stack slice of a fashion marketplace Product Detail Page (PDP) that helps customers decide with **explainable purchase confidence** (availability, final price, delivery trust, and alternatives) instead of decorative badges alone.

---

## Problem Understanding

LAAM customers often drop off before add-to-cart because they face four compounding uncertainties: is this size actually in stock, is the price final (or are there hidden discounts about to expire), will the delivery really arrive on time, and are there better alternatives they're missing? These aren't independent worries: they hit simultaneously on the PDP, and no single signal resolves all of them.

This project addresses that with a **Confidence Panel** that answers all four questions for a selected size in one place. The differentiating principle: every signal must answer **"why do you say that?"** Delivery confidence is computed from real seller history (a seeded `DeliveryLog` table), not a hardcoded badge. Expanding "Why?" shows the exact count: "1 of the last 5 orders from this seller arrived on or before the promised date", so the customer, not just the badge, understands the risk.

---

## Scope

### Built

- **Product listing page**: 8 seeded products across 3 categories (Kurtas, Sarees, Lehengas), sale badge, hover interactions
- **Product Detail Page**: breadcrumb, image, brand/seller info, size selector with per-size stock display
- **Size selector**: out-of-stock sizes remain selectable (not disabled) to trigger confidence lookup and show alternatives
- **Confidence Panel**: live async lookup per size change with skeleton loading state, covering:
  - Availability (in-stock with count, or explicit OOS message)
  - Final price after active discounts; urgency countdown banner when discount expires within 24 hours
  - Delivery trust: estimated window + High / Medium / Low label computed from seller's last 5 deliveries, with expandable "Why?" reason
  - Alternatives: 2–3 in-stock same-category products within ±25% price, triggered by OOS or Low confidence; explicit empty state when none exist
- **Three REST API endpoints**: `/api/products`, `/api/products/:id`, `/api/products/:id/confidence?size=`
- **Pure `lib/confidence.ts` module**: no DB calls inside; fully unit-tested
- **12 unit tests** in `lib/confidence.test.ts`
- **`AI_LOG.md`** audit trail

### Intentionally not built

| Out of scope | Why |
|---|---|
| Cart / checkout / payment | Assignment scope is confidence *before* purchase, not the transaction itself |
| User accounts / authentication | Adds reviewer setup friction with zero confidence-feature value |
| Real courier or payment gateway integration | Confidence computed from seeded `DeliveryLog`; no live APIs needed |
| Search or catalog filtering | Listing is intentionally small and curated for edge-case demos |
| Currency conversion | Single currency (PKR) keeps price logic simple and reviewable |
| Admin panel or seller dashboard | Seed script replaces operational tooling for this assessment |

---

## User Flow

1. **Discovery**: Customer lands on the listing page, browses 8 products with category, brand, price, and sale badges. An edge-case legend at the top signals which products demonstrate which scenarios.

2. **Product detail**: Customer opens a PDP. The first in-stock size is pre-selected. The customer sees brand, seller, base price, and the size selector immediately.

3. **Confidence lookup**: On any size selection (including OOS sizes), the Confidence Panel fetches and renders:
   - **Availability**: green checkmark + unit count for in-stock; red X + "see alternatives below" for OOS
   - **Final price**: discounted price with strikethrough original; amber blinking "Discount ends today (Xh Ym left)" banner if expiry is within 24 hours
   - **Delivery trust**: estimated days + confidence badge (colour-coded High/Medium/Low) with a "Why?" button that expands the human-readable reason derived from delivery history
   - **Alternatives**: triggered when OOS or Low confidence; shows 1–3 similar in-stock products with clickable cards and reasons; explicit "No close alternatives available right now" empty state if none qualify

4. **Decision**: Customer either proceeds confidently (High, in-stock, no alternatives section shown) or uses the alternatives to navigate to a better option.

### Edge-case demo products

| Product | Edge case to explore |
|---|---|
| Embroidered Kurta | Select size M → OOS message + alternatives |
| Silk Saree | Select any size → "Discount ends today (Xh Ym left)" urgency banner |
| Bridal Lehenga | Select any size → LOW CONFIDENCE badge + Party Lehenga alternative |
| Block-Print Kurta | Select any size → MEDIUM confidence + "limited delivery history" honest reason |
| Designer Lehenga Set | Select L or XL → alternatives triggered but empty state shown (no peer within ±25% of PKR 85,000) |
| Casual Cotton Kurta | Toggle sizes → XS and L show OOS labels; S/M/XL show stock counts |
| Festive Saree | Select any size → HIGH confidence, no alternatives section |

---

## Technical Approach

### Stack

- **Next.js 14 (App Router) + TypeScript + Tailwind CSS**: full-stack in one repo, strict mode enabled
- **SQLite + Prisma**: reviewers can `git clone → npm install → npm run seed → npm run dev` in under two minutes with zero external service configuration
- **Vitest**: fast, zero-config unit tests for pure confidence logic

Stack justification: SQLite + Prisma is the only choice that gives a reviewer a working app with one command and no `.env` setup. The confidence logic being pure (no DB calls inside `lib/confidence.ts`) means the highest-judgment code is also the most testable code.

### Frontend structure

```
app/
  layout.tsx                      # Sticky header, Inter font, footer
  page.tsx                        # RSC: product grid + hero + edge-case legend
  globals.css                     # Design tokens, shimmer, hover animations
  product/[id]/
    page.tsx                      # RSC: PDP shell, image, breadcrumb, metadata
    not-found.tsx                 # 404 boundary
components/
  ProductCard.tsx                 # Listing card with hover lift + animated pill
  ProductDetailClient.tsx         # Client boundary: holds selectedSize state
  SizeSelector.tsx                # Size buttons with per-size OOS/stock display
  ConfidencePanel.tsx             # Async confidence fetch + all panel sections
  DeliveryConfidenceBadge.tsx     # Colour badge + expandable Why? reason
  AlternativesRow.tsx             # Alternative cards + explicit empty state
```

Server Components handle listing and PDP shells (direct Prisma reads). Client Components handle the interactive size selector and async confidence fetch. The split keeps the initial page render fast and server-rendered while the confidence panel hydrates independently.

### Backend / API structure

| Endpoint | Purpose |
|---|---|
| `GET /api/products` | Listing fields: id, name, brand, basePrice, category, image, hasDiscount |
| `GET /api/products/:id` | Full PDP payload: variants (size + stock), priceRule, seller |
| `GET /api/products/:id/confidence?size=M` | Aggregated confidence payload (see shape below) |

```json
{
  "availability": { "inStock": true, "stock": 3 },
  "price": {
    "base": 8900, "final": 7120, "discountPct": 20,
    "discountExpiresAt": "2026-07-31T...", "urgentExpiry": true
  },
  "delivery": {
    "estimatedDays": "3–5 days",
    "confidence": "Low",
    "reason": "1 of the last 5 orders from this seller arrived on or before the promised date"
  },
  "alternatives": [
    { "id": "...", "name": "Party Lehenga", "brand": "Sana Safinaz",
      "price": 28000, "image": "...", "reason": "Similar style, in stock in your size (M)" }
  ]
}
```

The confidence endpoint is **one aggregating call** because the UI consumes it as a single panel with one loading state: the API shape mirrors UI usage, not REST purity.

**Alternatives trigger logic:**
- `!inStock` → show alternatives
- `delivery.confidence === "Low"` → show alternatives
- Otherwise → empty array (no alternatives section on happy path)

**Alternatives selection:** same category, has any variant with stock > 0, basePrice within ±25% of current product, exclude current product, sort by price proximity, cap at 3.

### Data model

```
Seller         (id, name, deliveryDaysMin, deliveryDaysMax)
  └─ Product   (id, name, brand, category, basePrice, images[JSON], sellerId)
       ├─ Variant    (id, productId, size, stock, sku)
       └─ PriceRule  (id, productId, discountPct?, discountExpiresAt?)
  └─ DeliveryLog (id, sellerId, promisedDate, actualDate)
```

`DeliveryLog` rows are the source of truth for delivery confidence. `late = actualDate > promisedDate`.

### Key decisions

1. **Linear recency weighting**: N=5 most recent logs (sorted newest-first) get weights `[5,4,3,2,1]`. Weighted on-time rate = Σ(weight × onTime) / Σ(weight). Threshold: ≥0.80 → High, 0.40–0.79 → Medium, <0.40 → Low. Linear is simpler to explain and test than exponential decay.

2. **Zero delivery history -> Medium** with reason "New seller: limited delivery history available". Never fake High or Low without data. Honesty about uncertainty is a product principle, not just a technical edge case.

3. **Pure `lib/confidence.ts`**: no DB calls inside; the API layer fetches logs and passes arrays. Consequence: the entire confidence calculation is unit-testable without a database or Next.js runtime.

4. **OOS sizes remain selectable**: `disabled` was rejected for OOS size buttons because a blocked button gives the customer no path forward. Selecting an OOS size triggers the confidence fetch and immediately surfaces alternatives.

5. **`AbortController` in `ConfidencePanel`**: rapid size changes cancel in-flight fetches, preventing stale responses from overwriting newer ones.

### Assumptions

- Single currency (PKR); no localisation
- Static delivery day ranges per seller (the confidence *label* is computed; the estimate range is not)
- Placeholder images from [Picsum Photos](https://picsum.photos): stable, free, no auth required
- Size set fixed to XS / S / M / L / XL

---

## How to Run

**Prerequisites:** Node.js 18+ (tested on 20.x)

```bash
# 1. Install dependencies (also runs prisma generate via postinstall)
npm install

# 2. Apply the schema to the database
npx prisma db push

# 3. Seed the database with 8 edge-case products
npm run seed

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Run unit tests:**

```bash
npm test
```

**Fresh database reset:**

```powershell
# Windows PowerShell
Remove-Item prisma\dev.db -ErrorAction SilentlyContinue
npx prisma db push
npm run seed
```

```bash
# macOS / Linux
rm -f prisma/dev.db
npx prisma db push
npm run seed
```

> **Note:** The project uses `npx prisma db push` (not `migrate dev`) so reviewers don't need to manage migration history. The migration file in `prisma/migrations/` documents the schema history but is not required for the reviewer flow.

---

## Tests

### Covered: `lib/confidence.test.ts` (12 tests)

| Suite | What's tested |
|---|---|
| `isOnTime` | Returns true when actual ≤ promised; false when late |
| `computeDeliveryConfidence` | High (mostly on-time), Low (mostly late), Medium (mixed), zero-history → Medium + exact reason string, **recency weighting proves weighting drives outcome** (same raw on-time count, different recency → different labels) |
| `computeFinalPrice` | Urgent expiry within 24h, expired discount returns base price |
| `findAlternatives` | OOS → alternatives returned, Low confidence in-stock → alternatives returned, High confidence in-stock → empty array |

The recency-weighting test is the most important: both fixtures have 3/5 on-time deliveries but differ in *which* deliveries were recent. `recentGood` scores Medium; `recentBad` scores Low. This proves the weighting algorithm (not just the count) drives the confidence label.

### What I'd test next, and why

1. **API route integration tests** (`GET /api/products/:id/confidence`): verify the wiring: correct 400 on missing size, 404 on bad product ID, correct `confidence: "Low"` shape for QuickFashion products against seeded DB. Highest-value next addition because it covers the full data-to-response path that unit tests don't touch.

2. **Playwright end-to-end**: `Embroidered Kurta → select M → alternatives appear` and `Silk Saree → urgency banner visible`. These test the client-side fetch and DOM update path that neither unit tests nor API tests cover.

3. **SizeSelector keyboard navigation**: `aria-pressed` state, Tab order, Enter to select. A11y is a correctness requirement, not a polish concern.

---

## Tradeoffs

| Decision | Tradeoff |
|---|---|
| Static delivery ETA range per seller | The confidence *label* is computed; the window is not. A real system would derive ETA from pincode + courier SLA. Kept static to stay within scope. |
| Direct Prisma calls in RSC for listing/PDP | Avoids self-fetching API routes from server components, which is faster and simpler. The REST endpoints still exist and are used by the confidence panel (client-side fetch). |
| No pagination on listing | 8 products fits on one page. A real catalog would need cursor pagination (deferred because it adds no demo value). |
| Picsum Photos placeholder images | Picsum is free and auth-free. Real product images would come from a CDN (e.g. Cloudflare Images). |
| No mobile layout polish pass | The grid is responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) and the PDP stacks vertically on mobile. No dedicated mobile UX review was done within the time box. |
| Prisma 6 (not 7) | Node 20.16 compatibility on the development machine. |

---

## Future Improvements

1. **Real-time stock**: confidence panel stock count should be invalidated when another session adds to cart. WebSockets or short-TTL polling.

2. **Per-pincode delivery estimates**: replace static `deliveryDaysMin/Max` with courier API + pincode lookup. Confidence label stays computed from history; ETA becomes dynamic.

3. **Confidence score observability**: log confidence labels and alternative click-through rates to analytics. This data closes the loop: if Low-confidence products with good alternatives convert well, the alternatives feature has measurable value.

4. **Seller dashboard**: sellers should be able to see their own confidence score and the reason, not just customers. Transparency motivates improvement.

5. **Caching**: the confidence endpoint is cheap now (5-row DeliveryLog query) but expensive at scale. A 60-second Redis TTL keyed on `(productId, size)` would handle high-traffic PDPs without staleness risk.

6. **Weighted confidence with more signals**: current model uses only delivery history. Return rate, seller response time, and review scores could be combined into a richer confidence signal.

---

## AI Usage

**Tools used:** Antigravity (Claude Sonnet 4.6) via Gemini, accessed through the Cursor-integrated AI coding assistant.

**What AI helped with:**
- Initial project scaffolding (Next.js + Prisma + Vitest config, package.json scripts)
- Prisma schema design from the data model spec
- `lib/confidence.ts` structure and TypeScript types
- React component boilerplate (`ProductCard`, `SizeSelector`, `ConfidencePanel`, etc.)
- Seed edge-case matrix and product/seller data planning
- README section outlines and formatting

**What was manually reviewed and changed:**
- All delivery log values in `prisma/seed.ts`: the AI's first pass had the semantics inverted (see below)
- Recency-weighting test fixture: rewritten to use equal raw counts with different recency
- `SizeSelector` OOS behaviour: AI used `disabled`; changed to selectable with dashed border
- `ConfidencePanel` fetch management: `AbortController` added manually to prevent race conditions
- `buildAlternativeReason`: AI always returned "in stock in your size" regardless of whether the alternative actually had that size; fixed with per-variant check
- Switched from Unsplash (requires API key, broken without it) to Picsum Photos after visual review caught broken images
- API response shape: stripped internal `showAlternativesSection` field that AI included; client re-derives it

**Specific technical judgment call: the seed delivery log inversion:**

The first-pass seed used `deliveryLog(sellerId, promisedDaysAgo, actualDaysAgo)` with values like `deliveryLog(reliableBoutique.id, 5, 4)`. The AI's implicit intent was "promised 5 days ago, arrived 4 days ago = on time." But the function creates `promisedDate = now − promisedDaysAgo` and `actualDate = now − actualDaysAgo`. On-time means `actualDate ≤ promisedDate`, which expands to `now − actualDaysAgo ≤ now − promisedDaysAgo`, i.e. `actualDaysAgo ≥ promisedDaysAgo`. With `(5, 4)`, actual is 4 days ago and promised is 5 days ago (actual arrived *later* on the calendar, meaning **LATE**, not on-time). Every ReliableBoutique log was off. ReliableBoutique scored Low confidence instead of High, meaning the entire confidence system was producing backwards results silently. I caught this by manually tracing the on-time condition through the date arithmetic, added a semantic comment to the `deliveryLog()` helper, and flipped all values. This is documented in detail in [`AI_LOG.md`](./AI_LOG.md).
