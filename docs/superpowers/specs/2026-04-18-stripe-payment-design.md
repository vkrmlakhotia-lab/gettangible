# Stripe Payment Integration — Design Spec
**Date:** 2026-04-18  
**Status:** Approved  
**Scope:** Test mode, client-side only, iPhone-first

---

## Overview

Add Stripe Payment Element to the existing Checkout flow so users can pay for their photo book with Apple Pay (primary) or a card (fallback). No backend changes in this phase — test mode only. The integration sits entirely in the frontend using Stripe's publishable key.

---

## Account & Keys

1. Create a free Stripe account at stripe.com (no credit card required).
2. In the Stripe Dashboard, locate the **test mode** publishable key: `pk_test_51...`
3. Add to `.env` (already gitignored):
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
   ```
4. The secret key (`sk_test_...`) is **not used** in this phase — it stays in the Stripe dashboard only.
5. Enable Apple Pay in Stripe Dashboard → Settings → Payment Methods.

---

## Architecture

**Client-side only.** No Supabase Edge Function, no webhooks, no server in this phase.

```
Checkout.tsx
  └── taps "Pay"
        └── StripePaymentSheet.tsx (bottom sheet)
              └── Stripe Payment Element (hosted by Stripe)
                    └── on success → markOrdered() → "Order placed!" screen
```

**New files:**
| File | Purpose |
|------|---------|
| `src/lib/stripe.ts` | Initialises Stripe with `VITE_STRIPE_PUBLISHABLE_KEY` |
| `src/components/StripePaymentSheet.tsx` | Bottom sheet wrapping the Stripe Payment Element |

**Modified files:**
| File | Change |
|------|--------|
| `src/pages/Checkout.tsx` | Pay button triggers payment sheet instead of calling `markOrdered()` directly |
| `.env` | Add `VITE_STRIPE_PUBLISHABLE_KEY` |
| `package.json` | Add `@stripe/stripe-js` and `@stripe/react-stripe-js` |

---

## User Flow (iPhone)

1. User fills in name and address on Checkout screen
2. Taps **"Pay · £XX.XX"**
3. Bottom sheet slides up — Stripe Payment Element renders
4. **Apple Pay button shown at top** (black, with Apple logo) — this is the primary CTA on iPhone
5. User taps Apple Pay → Face ID prompt → payment confirmed
6. Sheet dismisses
7. `markOrdered()` is called → existing "Order placed!" confirmation screen shown
8. Fallback: if Apple Pay not available, card input form (number / expiry / CVC) shown instead

---

## Test Mode

- Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC to simulate a successful payment
- Apple Pay test mode works in Safari on a real iPhone — does not work in Chrome on iPhone or in Mac browser
- No real money is charged in test mode

---

## Out of Scope (this phase)

| Item | Why deferred |
|------|-------------|
| Server-side PaymentIntent (Supabase Edge Function) | Required before going live — secret key must never be in frontend code |
| Webhooks | Needed for production reliability — not required for test mode |
| Email receipts | Can be configured in Stripe Dashboard later |
| Saved cards | Requires backend work |
| Prodigi order triggered by payment | Separate integration phase |

---

## Before Going Live (future work)

The client-side PaymentIntent approach is **test mode only**. Before charging real users:
1. Move PaymentIntent creation to a Supabase Edge Function (uses secret key server-side)
2. Add a webhook endpoint to confirm payment before fulfilling the order
3. Register the Apple Pay domain with Stripe

---

## Dependencies

- Stripe account created and test keys available
- Existing `Checkout.tsx`, `BookContext.tsx`, and `markOrdered()` function unchanged in behaviour
- `.env` file exists and is gitignored (already the case)
