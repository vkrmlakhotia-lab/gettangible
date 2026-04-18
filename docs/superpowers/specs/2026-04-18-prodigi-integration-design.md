# Prodigi Integration Design
**Date:** 2026-04-18
**Status:** Approved

## Overview

Wire up the Checkout flow to submit real print orders to Prodigi. When a user places an order, the app renders their book pages into a print-ready PDF, uploads it to Supabase Storage, and submits it to Prodigi via a secure Edge Function. The user sees a real order confirmation with a Prodigi order ID.

---

## Product

- **SKU:** `BOOK-FE-A4-L-HARD-G` — A4 Landscape Hard Cover, Gloss 200gsm, Matte Cover
- **Page resolution:** 3507 × 2480px (A4 landscape at 300dpi)
- **Extra page cost:** £0.33/page above base
- **Shipping:** Budget, GB only (for now)
- **Pricing:** fetched live from Prodigi quote API at checkout load

---

## Architecture

```
User taps "Place Order"
  │
  ├─ 1. Render each BookPage → canvas (html2canvas, 3507×2480px)
  ├─ 2. Stitch canvases → multi-page PDF (jsPDF)
  ├─ 3. Upload PDF → Supabase Storage (pdfs/{userId}/{bookId}.pdf)
  │
  ├─ 4. POST to Supabase Edge Function:
  │       - pdfUrl, shipping address, bookId, pageCount
  │
  │   Edge Function:
  │       - POST /v4.0/orders → Prodigi (API key never touches browser)
  │       - Write to Supabase orders table
  │       - Return { orderId, prodigiOrderId }
  │
  └─ 5. Update book status → 'ordered', show confirmation
```

---

## Files

### New
| File | Purpose |
|------|---------|
| `src/lib/renderBook.ts` | Renders all BookPages to a PDF Blob |
| `src/lib/postcodes.ts` | Wraps postcodes.io lookup |
| `supabase/functions/submit-order/index.ts` | Edge Function — calls Prodigi API |
| `supabase/migrations/004_prodigi_orders.sql` | DB migration |

### Modified
| File | Change |
|------|--------|
| `src/pages/Checkout.tsx` | Full rewrite — structured address, rendering progress, live pricing |
| `src/context/BookContext.tsx` | `markOrdered()` updated to call Edge Function |
| `src/lib/database.types.ts` | Updated to match new schema columns |
| `.env.local` / `.env.example` | Remove `VITE_PRODIGI_API_KEY` (moves to Supabase secret) |

---

## Page Rendering (`src/lib/renderBook.ts`)

1. Create a hidden off-screen `div` at **750×531px** (A4 landscape proportions)
2. For each `BookPage`:
   - Mount the existing page layout React component into the hidden div via `ReactDOM.createRoot`
   - Call `html2canvas(container, { scale: 4.676, useCORS: true, allowTaint: false })`
   - Scale 4.676 = 3507 / 750 → exactly 3507×2480px output
   - Add canvas to jsPDF as an image
   - Unmount, proceed to next page
3. Return final PDF as `Blob`

**CORS:** Photos are Supabase signed URLs. `useCORS: true` is sufficient — Supabase Storage allows cross-origin reads by default.

**Performance:** ~15–30s for a 40-page book. UI shows a progress bar ("Preparing your book… 12/40 pages") and blocks navigation during rendering.

---

## Address Collection (`src/lib/postcodes.ts` + Checkout UI)

**Postcode lookup flow:**
1. User enters postcode → taps "Find address"
2. `GET https://api.postcodes.io/postcodes/{postcode}`
3. Auto-fills: line1, city, country (always GB)
4. User can edit any field before submitting
5. Address line 2 is optional, manual entry

**Fields collected:**
- Full name
- Address line 1 (auto-filled)
- Address line 2 (optional)
- Town / city (auto-filled)
- Postcode (auto-filled / confirmed)
- Country (locked to "GB")

---

## Checkout UI States

1. **Idle** — address form + live price summary
2. **Rendering** — progress bar "Preparing your book… N/40 pages" (navigation locked)
3. **Uploading** — "Uploading your book…" spinner
4. **Submitting** — "Placing order…" spinner
5. **Success** — order confirmation with Prodigi order ID
6. **Error** — specific message with retry button ("Rendering failed" / "Order failed")

---

## Edge Function (`supabase/functions/submit-order/index.ts`)

**Request (POST body):**
```json
{
  "bookId": "uuid",
  "pdfUrl": "https://...supabase.../pdfs/...",
  "pageCount": 40,
  "shipping": {
    "name": "Vikram Lakhotia",
    "line1": "10 Downing Street",
    "line2": "",
    "city": "London",
    "postcode": "SW1A 2AA",
    "countryCode": "GB"
  }
}
```

**Steps:**
1. Validate auth header (Supabase JWT) — reject unauthenticated requests
2. POST to `https://api.prodigi.com/v4.0/orders`:
   - SKU: `BOOK-FE-A4-L-HARD-G`
   - Asset: `pdfUrl` as the `default` print area
   - Shipping mapped to Prodigi's address shape
   - `shippingMethod: "Budget"`
3. Write order row to Supabase `orders` table
4. Return `{ orderId, prodigiOrderId }`

**Error handling:**
- Prodigi rejects order → return failure reason to client (e.g. "Address undeliverable")
- Prodigi unavailable → return 502, client shows retry

**API key:** Set as Supabase secret `PRODIGI_API_KEY`. Never set as `VITE_` env var.

---

## Database Migration (`004_prodigi_orders.sql`)

```sql
-- Add Prodigi fields to orders
ALTER TABLE orders
  ADD COLUMN prodigi_order_id text,
  ADD COLUMN pdf_url text,
  ADD COLUMN shipping_name text,
  ADD COLUMN shipping_address jsonb;

-- Add ordered_at to book_projects (referenced in code, missing from schema)
ALTER TABLE book_projects
  ADD COLUMN IF NOT EXISTS ordered_at timestamptz;
```

**New Storage bucket:** `pdfs` — created via Supabase dashboard or CLI. Private bucket (signed URLs only).

---

## Pricing

- Fetched via Prodigi quote API on Checkout page load
- Displayed as live price in order summary
- Stored in `orders` table (`price_per_page`, `delivery_fee`, `total`) as actual Prodigi prices
- Hardcoded fallback only if quote API fails (show error, not fake price)

---

## Security

- `PRODIGI_API_KEY` lives only in Supabase Edge Function secrets
- `VITE_PRODIGI_API_KEY` removed from all env files
- Edge Function validates Supabase JWT — only authenticated users can place orders
- PDF bucket is private — URLs are signed (10-year TTL, same as photos)

---

## Out of Scope

- Stripe payment (Phase 3, separate spec)
- Webhook from Prodigi for status updates (post-MVP)
- Non-GB shipping (post-MVP)
- Spine / cover print areas (post-MVP — default print area only for now)
