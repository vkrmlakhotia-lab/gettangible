# Stripe Payment Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Stripe Payment Element (with Apple Pay) to the Checkout screen so users can pay for their photo book in test mode.

**Architecture:** Client-side only for test mode. The app calls Stripe's API directly from the browser using the test secret key to create a PaymentIntent, receives a `clientSecret`, then renders Stripe's Payment Element in a vaul bottom sheet. On success, `markOrdered()` is called and the existing confirmation screen appears. The test secret key approach is test-mode-only — a Supabase Edge Function replaces it before going live.

**Tech Stack:** `@stripe/stripe-js`, `@stripe/react-stripe-js`, `vaul` (already installed), Vitest + jsdom for unit tests

---

## File Map

| File | Status | Responsibility |
|------|--------|---------------|
| `src/lib/stripe.ts` | **Create** | Load and export the Stripe.js instance |
| `src/components/StripePaymentSheet.tsx` | **Create** | Bottom sheet wrapping the Stripe Payment Element |
| `src/pages/Checkout.tsx` | **Modify** | Trigger payment sheet instead of calling markOrdered directly |
| `.env.local` | **Modify** | Add Stripe test publishable key and test secret key |
| `.env.example` | **Modify** | Add placeholder entries for Stripe keys |

---

## Task 1: Create Stripe account and get test keys

This task is entirely manual — no code changes.

- [ ] **Step 1: Sign up for Stripe**

  Go to https://stripe.com and click "Start now". Use your personal email (vkrmlakhotia@gmail.com). You do not need a company name yet — you can fill that in later. Complete email verification.

- [ ] **Step 2: Stay in test mode**

  In the Stripe Dashboard, look for the toggle in the top-right corner that says **"Test mode"**. Make sure it is ON (the toggle shows orange/amber). You are in test mode when the dashboard header shows "Test mode" and your keys start with `pk_test_` and `sk_test_`.

  > Never use live keys (`pk_live_`, `sk_live_`) in this integration. Test keys only.

- [ ] **Step 3: Get your publishable key**

  Go to **Developers → API keys** in the left sidebar. Copy the **Publishable key** — it starts with `pk_test_51...`

- [ ] **Step 4: Get your secret key**

  On the same page, click **"Reveal test key"** next to the Secret key. Copy it — it starts with `sk_test_51...`

  > This secret key is test-mode only. It can only ever charge fake cards. We put it in `.env.local` temporarily — it will be moved to a server-side Edge Function before going live.

- [ ] **Step 5: Enable Apple Pay**

  Go to **Settings → Payment methods → Apple Pay**. Click "Enable". Apple Pay works automatically on iPhone in Safari — no domain verification needed in test mode.

---

## Task 2: Install Stripe packages

- [ ] **Step 1: Install dependencies**

  Run from the project root (`/Users/vikramadityalakhotia/Documents/Claude/gettangible/`):

  ```bash
  npm install @stripe/stripe-js @stripe/react-stripe-js
  ```

  Expected output: something like `added 2 packages`. No errors.

- [ ] **Step 2: Verify installation**

  ```bash
  cat package.json | grep stripe
  ```

  Expected output:
  ```
  "@stripe/react-stripe-js": "^x.x.x",
  "@stripe/stripe-js": "^x.x.x",
  ```

---

## Task 3: Add environment variables

- [ ] **Step 1: Add keys to `.env.local`**

  Open `/Users/vikramadityalakhotia/Documents/Claude/gettangible/.env.local` and add these two lines at the bottom (replace the placeholder values with your real test keys from Task 1):

  ```
  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...your_key_here
  VITE_STRIPE_SECRET_KEY=sk_test_51...your_key_here
  ```

  > `VITE_STRIPE_SECRET_KEY` is used **test mode only** — it allows the app to create PaymentIntents without a server. Before going live, remove this and replace with a Supabase Edge Function.

- [ ] **Step 2: Add placeholders to `.env.example`**

  Open `/Users/vikramadityalakhotia/Documents/Claude/gettangible/.env.example` and add:

  ```
  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
  # TEST MODE ONLY - move to server-side Edge Function before going live
  VITE_STRIPE_SECRET_KEY=sk_test_your_secret_key_here
  ```

- [ ] **Step 3: Commit `.env.example` only**

  ```bash
  git add .env.example
  git commit -m "chore: add Stripe env var placeholders to .env.example"
  ```

  > Do NOT commit `.env.local` — it contains your real test keys.

---

## Task 4: Create `src/lib/stripe.ts`

- [ ] **Step 1: Write the failing test**

  Create `/Users/vikramadityalakhotia/Documents/Claude/gettangible/src/lib/stripe.test.ts`:

  ```typescript
  import { describe, it, expect, vi } from 'vitest'

  vi.mock('@stripe/stripe-js', () => ({
    loadStripe: vi.fn().mockResolvedValue({ id: 'mock-stripe' }),
  }))

  describe('stripe', () => {
    it('exports a stripePromise', async () => {
      const { stripePromise } = await import('./stripe')
      expect(stripePromise).toBeDefined()
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd /Users/vikramadityalakhotia/Documents/Claude/gettangible && npx vitest run src/lib/stripe.test.ts
  ```

  Expected: FAIL — "Cannot find module './stripe'"

- [ ] **Step 3: Create `src/lib/stripe.ts`**

  ```typescript
  import { loadStripe } from '@stripe/stripe-js'

  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error('Missing VITE_STRIPE_PUBLISHABLE_KEY')
  }

  export const stripePromise = loadStripe(publishableKey)
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd /Users/vikramadityalakhotia/Documents/Claude/gettangible && npx vitest run src/lib/stripe.test.ts
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/stripe.ts src/lib/stripe.test.ts
  git commit -m "feat: add Stripe.js initialisation"
  ```

---

## Task 5: Create `StripePaymentSheet.tsx`

This component:
1. When opened, creates a PaymentIntent by calling Stripe's API directly (test mode only)
2. Renders a vaul Drawer containing Stripe's `PaymentElement`
3. On payment success, calls `onSuccess()` so the parent can proceed with `markOrdered()`

- [ ] **Step 1: Write the failing test**

  Create `/Users/vikramadityalakhotia/Documents/Claude/gettangible/src/components/StripePaymentSheet.test.tsx`:

  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import StripePaymentSheet from './StripePaymentSheet'

  // Mock Stripe entirely — we test our component logic, not Stripe's
  vi.mock('@stripe/react-stripe-js', () => ({
    Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
    PaymentElement: () => <div data-testid="payment-element" />,
    useStripe: () => ({ confirmPayment: vi.fn().mockResolvedValue({ error: null }) }),
    useElements: () => ({}),
  }))

  vi.mock('@/lib/stripe', () => ({
    stripePromise: Promise.resolve(null),
  }))

  // Mock fetch for PaymentIntent creation
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ client_secret: 'pi_test_secret_123' }),
    }) as unknown as typeof fetch
  })

  describe('StripePaymentSheet', () => {
    it('renders nothing when closed', () => {
      render(
        <StripePaymentSheet
          open={false}
          onOpenChange={() => {}}
          amountPence={3599}
          onSuccess={() => {}}
        />
      )
      expect(screen.queryByTestId('stripe-elements')).toBeNull()
    })

    it('renders payment element when open', async () => {
      render(
        <StripePaymentSheet
          open={true}
          onOpenChange={() => {}}
          amountPence={3599}
          onSuccess={() => {}}
        />
      )
      // Drawer renders when open=true
      expect(screen.getByText(/Pay/i)).toBeDefined()
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd /Users/vikramadityalakhotia/Documents/Claude/gettangible && npx vitest run src/components/StripePaymentSheet.test.tsx
  ```

  Expected: FAIL — "Cannot find module './StripePaymentSheet'"

- [ ] **Step 3: Create `src/components/StripePaymentSheet.tsx`**

  ```tsx
  import { useEffect, useState } from 'react'
  import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
  import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
  import { stripePromise } from '@/lib/stripe'

  // ─── Inner form — rendered inside <Elements> ─────────────────────────────────
  function PaymentForm({
    amountPence,
    onSuccess,
    onClose,
  }: {
    amountPence: number
    onSuccess: () => void
    onClose: () => void
  }) {
    const stripe = useStripe()
    const elements = useElements()
    const [paying, setPaying] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handlePay = async () => {
      if (!stripe || !elements) return
      setPaying(true)
      setError(null)

      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Return URL required by Stripe even for in-app — we handle the result ourselves
          return_url: window.location.href,
        },
        redirect: 'if_required',
      })

      if (stripeError) {
        setError(stripeError.message ?? 'Payment failed. Please try again.')
        setPaying(false)
      } else {
        onSuccess()
      }
    }

    const pounds = (amountPence / 100).toFixed(2)

    return (
      <div className="px-4 pb-8 space-y-5">
        <PaymentElement options={{ layout: 'tabs' }} />

        {error && (
          <p className="text-[13px] text-red-500 text-center">{error}</p>
        )}

        <button
          onClick={handlePay}
          disabled={!stripe || paying}
          className="w-full bg-[#f8961e] disabled:opacity-40 text-white rounded-[16px] py-4 text-[16px] font-semibold"
        >
          {paying ? 'Processing…' : `Pay · £${pounds}`}
        </button>

        <button
          onClick={onClose}
          className="w-full text-[14px] text-muted-foreground py-2"
        >
          Cancel
        </button>
      </div>
    )
  }

  // ─── Shell — creates PaymentIntent and wraps in Elements ─────────────────────
  interface StripePaymentSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    amountPence: number
    onSuccess: () => void
  }

  export default function StripePaymentSheet({
    open,
    onOpenChange,
    amountPence,
    onSuccess,
  }: StripePaymentSheetProps) {
    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
      if (!open) {
        setClientSecret(null)
        setLoadError(null)
        return
      }

      // TEST MODE ONLY: creates PaymentIntent directly from browser.
      // Replace with a Supabase Edge Function call before going live.
      const secretKey = import.meta.env.VITE_STRIPE_SECRET_KEY

      fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: String(amountPence),
          currency: 'gbp',
          'automatic_payment_methods[enabled]': 'true',
        }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.error) throw new Error(data.error.message)
          setClientSecret(data.client_secret)
        })
        .catch(() => setLoadError('Could not initialise payment. Please try again.'))
    }, [open, amountPence])

    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-[17px] font-semibold text-foreground text-center">
              Payment
            </DrawerTitle>
          </DrawerHeader>

          {loadError && (
            <p className="text-[13px] text-red-500 text-center px-4 pb-8">{loadError}</p>
          )}

          {!clientSecret && !loadError && (
            <p className="text-[13px] text-muted-foreground text-center px-4 pb-8">
              Loading payment details…
            </p>
          )}

          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#f8961e',
                    colorBackground: '#ffffff',
                    colorText: '#577590',
                    borderRadius: '10px',
                  },
                },
              }}
            >
              <PaymentForm
                amountPence={amountPence}
                onSuccess={onSuccess}
                onClose={() => onOpenChange(false)}
              />
            </Elements>
          )}
        </DrawerContent>
      </Drawer>
    )
  }
  ```

- [ ] **Step 4: Run test to verify it passes**

  ```bash
  cd /Users/vikramadityalakhotia/Documents/Claude/gettangible && npx vitest run src/components/StripePaymentSheet.test.tsx
  ```

  Expected: PASS

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/StripePaymentSheet.tsx src/components/StripePaymentSheet.test.tsx
  git commit -m "feat: add StripePaymentSheet component with Payment Element"
  ```

---

## Task 6: Update `Checkout.tsx` to use the payment sheet

- [ ] **Step 1: Read the current file**

  Read `src/pages/Checkout.tsx` to confirm the current structure before editing. Verify that:
  - `handleOrder` currently calls `markOrdered()` directly (line ~35–47)
  - The Pay button is at the bottom (line ~126–137)

- [ ] **Step 2: Replace `Checkout.tsx` with the updated version**

  The changes are:
  - Add `paymentOpen` state — controls when the payment sheet is shown
  - `handleOrder` now opens the sheet instead of calling `markOrdered()` directly
  - New `handlePaymentSuccess` function calls `markOrdered()` after Stripe confirms
  - Import `StripePaymentSheet`
  - Import `convertToAmountPence` helper (inline calculation)

  Replace the full file contents:

  ```tsx
  import { useEffect, useState } from 'react'
  import { useNavigate, useParams } from 'react-router-dom'
  import { useBooks } from '@/context/BookContext'
  import { ChevronLeft, MapPin, Package } from 'lucide-react'
  import StripePaymentSheet from '@/components/StripePaymentSheet'

  const PRICE_PER_PAGE = 1.20
  const DELIVERY = 4.99

  const Checkout = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { projects, setCurrentProject, currentProject, markOrdered } = useBooks()
    const [name, setName] = useState('')
    const [address, setAddress] = useState('')
    const [ordering, setOrdering] = useState(false)
    const [ordered, setOrdered] = useState(false)
    const [orderNumber, setOrderNumber] = useState('')
    const [paymentOpen, setPaymentOpen] = useState(false)

    useEffect(() => {
      if (id) setCurrentProject(id)
    }, [id, projects])

    if (!currentProject) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      )
    }

    const pageCount = currentProject.pages.length
    const subtotal = pageCount * PRICE_PER_PAGE
    const total = subtotal + DELIVERY
    const amountPence = Math.round(total * 100)

    // Opens the Stripe payment sheet
    const handleOrder = () => {
      if (!name || !address) return
      setPaymentOpen(true)
    }

    // Called by StripePaymentSheet after successful payment
    const handlePaymentSuccess = async () => {
      setPaymentOpen(false)
      setOrdering(true)
      try {
        const num = await markOrdered(currentProject.id)
        setOrderNumber(num || `T-${Date.now().toString().slice(-6)}`)
        setOrdered(true)
      } catch (err) {
        console.error(err)
      } finally {
        setOrdering(false)
      }
    }

    if (ordered) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-center">
            <p className="text-[22px] font-bold text-foreground">Order placed!</p>
            <p className="text-[14px] text-muted-foreground mt-1">Order #{orderNumber}</p>
            <p className="text-[13px] text-muted-foreground mt-3">
              Estimated delivery in 5–7 working days
            </p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="w-full bg-primary text-white rounded-[16px] py-4 text-[16px] font-semibold"
          >
            Back to Home
          </button>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background pb-32">
        <header className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-border">
          <button onClick={() => navigate(-1)}>
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-[17px] font-semibold">Checkout</h1>
        </header>

        <div className="px-4 pt-5 space-y-5">
          {/* Order summary */}
          <div className="bg-card border border-border rounded-[14px] p-4">
            <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Order Summary</p>
            <div className="flex justify-between text-[14px] text-foreground mb-2">
              <span>{currentProject.title}</span>
              <span>{pageCount} pages</span>
            </div>
            <div className="flex justify-between text-[13px] text-muted-foreground mb-1">
              <span>Pages ({pageCount} × £{PRICE_PER_PAGE.toFixed(2)})</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[13px] text-muted-foreground mb-3">
              <span>Delivery</span>
              <span>£{DELIVERY.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[15px] font-semibold text-foreground border-t border-border pt-3">
              <span>Total</span>
              <span>£{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery details */}
          <div className="bg-card border border-border rounded-[14px] p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Delivery Details</p>
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              className="w-full bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Delivery address"
              rows={3}
              className="w-full bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Pay button */}
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-background border-t border-border">
          <button
            onClick={handleOrder}
            disabled={!name || !address || ordering}
            className="w-full bg-primary disabled:opacity-40 text-white rounded-[16px] py-4 text-[16px] font-semibold"
          >
            {ordering ? 'Placing order…' : `Pay · £${total.toFixed(2)}`}
          </button>
        </div>

        <StripePaymentSheet
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          amountPence={amountPence}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    )
  }

  export default Checkout
  ```

- [ ] **Step 3: Run all tests to make sure nothing broke**

  ```bash
  cd /Users/vikramadityalakhotia/Documents/Claude/gettangible && npx vitest run
  ```

  Expected: All existing tests PASS. The two new test files also PASS.

- [ ] **Step 4: Commit**

  ```bash
  git add src/pages/Checkout.tsx
  git commit -m "feat: wire Stripe payment sheet into Checkout flow"
  ```

---

## Task 7: Manual end-to-end test

This task has no code changes — it's entirely manual verification.

- [ ] **Step 1: Start the dev server**

  ```bash
  cd /Users/vikramadityalakhotia/Documents/Claude/gettangible && npm run dev
  ```

  Expected: Vite starts, no errors about missing env vars.

- [ ] **Step 2: Navigate to Checkout**

  Open the app in browser (or on device). Navigate to a book's Checkout page.
  Fill in a name and address. Tap **"Pay · £X.XX"**.

  Expected: A bottom sheet slides up. It shows "Loading payment details…" briefly, then the Stripe Payment Element appears.

- [ ] **Step 3: Test with a Stripe test card**

  In the card form, enter:
  - Card number: `4242 4242 4242 4242`
  - Expiry: `12/34` (any future date)
  - CVC: `123` (any 3 digits)
  - Postcode: `SW1A 1AA` (any valid postcode)

  Tap **Pay**. Expected: Payment processes, sheet closes, "Order placed!" screen appears.

- [ ] **Step 4: Verify in Stripe Dashboard**

  Go to **stripe.com → Payments** (in test mode). You should see a new payment for the correct amount in GBP with status "Succeeded".

- [ ] **Step 5: Test a declined card**

  Open Checkout again. In the payment sheet, use:
  - Card number: `4000 0000 0000 9995` (always declines)

  Expected: An error message appears in the sheet ("Your card has insufficient funds" or similar). The sheet stays open. The order is NOT placed.

- [ ] **Step 6: Final commit**

  ```bash
  git add -A
  git commit -m "feat: Stripe Payment Element integration complete (test mode)"
  ```

---

## Before Going Live — Checklist

These items are out of scope now but **must** be completed before charging real users:

- [ ] Remove `VITE_STRIPE_SECRET_KEY` from `.env.local` and `.env.example`
- [ ] Create a Supabase Edge Function (`create-payment-intent`) that creates PaymentIntents server-side using the Stripe secret key
- [ ] Update `StripePaymentSheet.tsx` to call the Edge Function instead of calling Stripe's API directly
- [ ] Register your domain with Stripe for Apple Pay (required for live mode)
- [ ] Add a Stripe webhook to confirm payment before fulfilling the Prodigi order
- [ ] Switch to live keys (`pk_live_`, `sk_live_`) in production env vars
