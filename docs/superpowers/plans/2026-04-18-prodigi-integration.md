# Prodigi Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the Checkout flow to submit real print orders to Prodigi — rendering the book pages client-side, uploading a PDF to Supabase Storage, and submitting via a secure Edge Function.

**Architecture:** The browser renders each `BookPage` using `html2canvas` (mounting the existing `PageRenderer` component off-screen), stitches all pages into a PDF with `jsPDF`, uploads to Supabase Storage, then calls a Supabase Edge Function which holds the Prodigi API key and POSTs the order.

**Tech Stack:** `html2canvas`, `jspdf`, postcodes.io (free, no key), Supabase Edge Functions (Deno), Prodigi REST API v4.0

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/postcodes.ts` | Create | Wraps postcodes.io API |
| `src/lib/renderBook.ts` | Create | Renders all BookPages → PDF Blob |
| `supabase/functions/submit-order/index.ts` | Create | Edge Function: calls Prodigi, writes order to DB |
| `src/pages/Checkout.tsx` | Rewrite | Full checkout UI with address + progress states |
| `src/context/BookContext.tsx` | Modify | Add `orderPlaced()`, simplify `markOrdered` |
| `src/lib/database.types.ts` | Modify | Add new columns to orders + book_projects types |
| `.env.local` | Modify | Remove `VITE_PRODIGI_API_KEY`, `VITE_PRODIGI_BOOK_SKU` |
| `.env.example` | Modify | Same |

---

## Task 1: Install Dependencies

**Files:** `package.json`

- [ ] **Step 1: Install html2canvas and jspdf**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
bun add html2canvas jspdf
bun add -d @types/html2canvas
```

Expected output: packages added to `node_modules`, versions in `package.json`.

- [ ] **Step 2: Verify install**

```bash
grep -E "html2canvas|jspdf" package.json
```

Expected: both packages appear in `dependencies`.

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lock bun.lockb
git commit -m "chore: add html2canvas and jspdf for print rendering"
```

---

## Task 2: Database Migration

**Files:** Run SQL in Supabase dashboard → then update `src/lib/database.types.ts`

- [ ] **Step 1: Open Supabase SQL editor**

Go to your Supabase project dashboard → SQL Editor → New query.

- [ ] **Step 2: Run this migration**

```sql
-- Add Prodigi fields to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS prodigi_order_id text,
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS shipping_name text,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb;

-- Add ordered_at to book_projects (referenced in code but missing from schema)
ALTER TABLE book_projects
  ADD COLUMN IF NOT EXISTS ordered_at timestamptz;
```

Click Run. Expected: "Success. No rows returned."

- [ ] **Step 3: Update `src/lib/database.types.ts`**

Replace the `orders` Row and Insert/Update blocks with:

```typescript
orders: {
  Row: {
    id: string
    user_id: string
    book_id: string
    book_title: string
    page_count: number
    price_per_page: number
    delivery_fee: number
    total: number
    status: 'processing' | 'printed' | 'shipped' | 'delivered'
    tracking_number: string | null
    estimated_delivery: string | null
    ordered_at: string
    prodigi_order_id: string | null
    pdf_url: string | null
    shipping_name: string | null
    shipping_address: Record<string, string> | null
  }
  Insert: {
    id?: string
    user_id: string
    book_id: string
    book_title: string
    page_count: number
    price_per_page: number
    delivery_fee: number
    total: number
    status?: 'processing' | 'printed' | 'shipped' | 'delivered'
    tracking_number?: string | null
    estimated_delivery?: string | null
    prodigi_order_id?: string | null
    pdf_url?: string | null
    shipping_name?: string | null
    shipping_address?: Record<string, string> | null
  }
  Update: {
    status?: 'processing' | 'printed' | 'shipped' | 'delivered'
    tracking_number?: string | null
    estimated_delivery?: string | null
    prodigi_order_id?: string | null
    pdf_url?: string | null
  }
}
```

Also add `ordered_at` to the `book_projects` Row:
```typescript
// Inside book_projects.Row, add:
ordered_at: string | null
```

And to `book_projects.Update`:
```typescript
ordered_at?: string | null
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "feat: add prodigi_order_id, pdf_url, shipping fields to orders schema"
```

---

## Task 3: Create the `pdfs` Storage Bucket

- [ ] **Step 1: Create bucket in Supabase dashboard**

Go to Supabase dashboard → Storage → New bucket.
- Name: `pdfs`
- Public: **No** (private — signed URLs only)
- Click Create.

- [ ] **Step 2: Set storage policy**

In the bucket → Policies tab → Add policy:
- Policy name: `Users can upload their own PDFs`
- Allowed operations: SELECT, INSERT
- Policy definition:
```sql
(auth.uid()::text = (storage.foldername(name))[1])
```

This ensures users can only upload/read PDFs in their own `userId/` folder.

---

## Task 4: Postcode Lookup Service

**Files:**
- Create: `src/lib/postcodes.ts`
- Test: verify manually in Checkout (unit test skipped — this is a thin HTTP wrapper)

- [ ] **Step 1: Create `src/lib/postcodes.ts`**

```typescript
export interface PostcodeResult {
  postcode: string
  line1: string
  city: string
  countryCode: 'GB'
}

export async function lookupPostcode(postcode: string): Promise<PostcodeResult> {
  const cleaned = postcode.replace(/\s+/g, '').toUpperCase()
  const res = await fetch(`https://api.postcodes.io/postcodes/${cleaned}`)
  if (!res.ok) throw new Error('Postcode not found')
  const { result } = await res.json()
  return {
    postcode: result.postcode,
    line1: [result.thoroughfare, result.post_town].filter(Boolean).join(', ') || result.admin_district,
    city: result.admin_district,
    countryCode: 'GB',
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/postcodes.ts
git commit -m "feat: add postcodes.io lookup service"
```

---

## Task 5: Book Rendering Service

**Files:**
- Create: `src/lib/renderBook.ts`

This is the most complex piece. It mounts `PageRenderer` into a hidden off-screen DOM container at 750×531px (A4 landscape proportions), captures each page with `html2canvas` at ×4.676 scale (→ 3507×2480px), and stitches all pages into a jsPDF document.

- [ ] **Step 1: Create `src/lib/renderBook.ts`**

```typescript
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { createElement } from 'react'
import PageRenderer from '@/components/PageRenderer'
import type { BookPage } from '@/types/book'

// A4 landscape at 300dpi = 3507 × 2480px
// Container at 750 × 531px → scale 4.676 → 3507 × 2483px (≈ 2480)
const CONTAINER_W = 750
const CONTAINER_H = 531
const SCALE = 3507 / CONTAINER_W // 4.676

function waitForImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'))
  if (imgs.length === 0) return Promise.resolve()
  return Promise.all(
    imgs.map(img =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>(resolve => {
            img.onload = () => resolve()
            img.onerror = () => resolve() // don't block on broken images
          })
    )
  ).then(() => undefined)
}

export async function renderBookToPdf(
  pages: BookPage[],
  title: string,
  onProgress?: (done: number, total: number) => void
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [3507, 2480],
    hotfixes: ['px_scaling'],
  })

  // Create hidden off-screen container
  const container = document.createElement('div')
  container.style.cssText = [
    `position:fixed`,
    `left:-${CONTAINER_W + 100}px`,
    `top:0`,
    `width:${CONTAINER_W}px`,
    `height:${CONTAINER_H}px`,
    `overflow:hidden`,
    `background:#ffffff`,
  ].join(';')
  document.body.appendChild(container)

  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]

      // Mount page into hidden container
      const root = createRoot(container)
      root.render(createElement(PageRenderer, { page, title }))

      // Wait for images to load
      await new Promise(r => setTimeout(r, 50)) // let React render
      await waitForImages(container)

      // Capture at print resolution
      const canvas = await html2canvas(container, {
        scale: SCALE,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
      })

      // Add to PDF
      if (i > 0) pdf.addPage([3507, 2480], 'landscape')
      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      pdf.addImage(imgData, 'JPEG', 0, 0, 3507, 2480)

      root.unmount()
      onProgress?.(i + 1, pages.length)
    }
  } finally {
    document.body.removeChild(container)
  }

  return pdf.output('blob')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/renderBook.ts
git commit -m "feat: add client-side book PDF renderer using html2canvas + jsPDF"
```

---

## Task 6: Supabase Edge Function

**Files:**
- Create: `supabase/functions/submit-order/index.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p /Users/vikramadityalakhotia/Documents/Claude/gettangible/supabase/functions/submit-order
```

- [ ] **Step 2: Create `supabase/functions/submit-order/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PRODIGI_API_KEY = Deno.env.get('PRODIGI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  postcode: string
  countryCode: string
}

interface SubmitOrderBody {
  bookId: string
  bookTitle: string
  pdfUrl: string
  pageCount: number
  shipping: ShippingAddress
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify auth
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const body: SubmitOrderBody = await req.json()
  const { bookId, bookTitle, pdfUrl, pageCount, shipping } = body

  // Submit to Prodigi
  const prodigiRes = await fetch('https://api.prodigi.com/v4.0/orders', {
    method: 'POST',
    headers: {
      'X-API-Key': PRODIGI_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shippingMethod: 'Budget',
      recipient: {
        name: shipping.name,
        address: {
          line1: shipping.line1,
          line2: shipping.line2 || undefined,
          postalOrZipCode: shipping.postcode,
          townOrCity: shipping.city,
          countryCode: shipping.countryCode,
        },
      },
      items: [{
        merchantReference: bookId,
        sku: 'BOOK-FE-A4-L-HARD-G',
        copies: 1,
        sizing: 'fillPrintArea',
        assets: [{
          printArea: 'default',
          url: pdfUrl,
        }],
      }],
    }),
  })

  const prodigiData = await prodigiRes.json()

  if (prodigiData.outcome !== 'Created') {
    console.error('Prodigi error:', JSON.stringify(prodigiData))
    return new Response(
      JSON.stringify({ error: 'Order rejected by Prodigi', detail: prodigiData }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const prodigiOrderId: string = prodigiData.order.id

  // Write order to DB using service role (bypasses RLS)
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: user.id,
      book_id: bookId,
      book_title: bookTitle,
      page_count: pageCount,
      price_per_page: 0,
      delivery_fee: 0,
      total: 0,
      status: 'processing',
      prodigi_order_id: prodigiOrderId,
      pdf_url: pdfUrl,
      shipping_name: shipping.name,
      shipping_address: shipping,
    })
    .select('id')
    .single()

  if (orderError) {
    console.error('DB error:', orderError)
    // Order placed with Prodigi — don't fail the user, just log
  }

  // Update book project status
  await supabaseAdmin
    .from('book_projects')
    .update({ status: 'ordered', ordered_at: new Date().toISOString() })
    .eq('id', bookId)

  return new Response(
    JSON.stringify({ orderId: order?.id, prodigiOrderId }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/submit-order/index.ts
git commit -m "feat: add submit-order Edge Function for Prodigi integration"
```

---

## Task 7: Deploy Edge Function + Set Secrets

- [ ] **Step 1: Check if Supabase CLI is installed**

```bash
supabase --version
```

If not installed:
```bash
brew install supabase/tap/supabase
```

- [ ] **Step 2: Link to your Supabase project**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
supabase login
supabase link
```

When prompted, select your Tangible project.

- [ ] **Step 3: Set the Prodigi API key as a secret**

```bash
supabase secrets set PRODIGI_API_KEY=4299e2cb-dcbc-4493-80e9-f572f5c8012b
```

Expected: `Finished supabase secrets set.`

- [ ] **Step 4: Deploy the Edge Function**

```bash
supabase functions deploy submit-order --no-verify-jwt
```

Note: `--no-verify-jwt` lets us handle JWT verification manually inside the function (which we do). Expected: `Deployed Function submit-order on ...`

- [ ] **Step 5: Note the function URL**

The function URL will be: `https://<your-project-ref>.supabase.co/functions/v1/submit-order`

You don't need to hardcode this — `supabase.functions.invoke('submit-order', ...)` resolves it automatically from the Supabase client config.

---

## Task 8: Update BookContext

**Files:** `src/context/BookContext.tsx`

Add an `orderPlaced` method to update local state after a successful order (called from Checkout after the Edge Function responds).

- [ ] **Step 1: Add `orderPlaced` to the `BookContextType` interface**

Find the interface (line 7) and add:
```typescript
orderPlaced: (id: string) => void
```

- [ ] **Step 2: Implement `orderPlaced` in the provider body**

Add this function after `clearCurrentProject` (around line 371):
```typescript
const orderPlaced = (id: string) => {
  setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'ordered' as const } : p))
  setCurrentProjectState(prev => prev?.id === id ? { ...prev, status: 'ordered' as const } : prev)
}
```

- [ ] **Step 3: Add `orderPlaced` to the context value**

In the `BookContext.Provider` value object (around line 374), add:
```typescript
orderPlaced,
```

- [ ] **Step 4: Commit**

```bash
git add src/context/BookContext.tsx
git commit -m "feat: add orderPlaced to BookContext for post-order state update"
```

---

## Task 9: Rewrite Checkout Page

**Files:** `src/pages/Checkout.tsx` (full rewrite)

- [ ] **Step 1: Replace the entire file content**

```typescript
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBooks } from '@/context/BookContext'
import { supabase } from '@/lib/supabase'
import { lookupPostcode } from '@/lib/postcodes'
import { renderBookToPdf } from '@/lib/renderBook'
import { ChevronLeft, MapPin, Package, Search, Loader2 } from 'lucide-react'

type CheckoutState = 'idle' | 'rendering' | 'uploading' | 'submitting' | 'success' | 'error'

const BASE_PRICE = 18.28   // Prodigi base for 24 pages
const PER_PAGE = 0.33      // Prodigi additional page rate
const SHIPPING = 14.80     // Budget shipping to GB
const BASE_PAGES = 24

function estimatePrice(pageCount: number): number {
  const extra = Math.max(0, pageCount - BASE_PAGES)
  return BASE_PRICE + extra * PER_PAGE + SHIPPING
}

const Checkout = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, setCurrentProject, currentProject, orderPlaced } = useBooks()

  const [name, setName] = useState('')
  const [line1, setLine1] = useState('')
  const [line2, setLine2] = useState('')
  const [city, setCity] = useState('')
  const [postcode, setPostcode] = useState('')
  const [postcodeInput, setPostcodeInput] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState('')

  const [stage, setStage] = useState<CheckoutState>('idle')
  const [renderProgress, setRenderProgress] = useState({ done: 0, total: 0 })
  const [prodigiOrderId, setProdigiOrderId] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

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
  const estimatedTotal = estimatePrice(pageCount)
  const canOrder = name && line1 && city && postcode && stage === 'idle'

  const handlePostcodeLookup = async () => {
    if (!postcodeInput.trim()) return
    setLookingUp(true)
    setLookupError('')
    try {
      const result = await lookupPostcode(postcodeInput)
      setPostcode(result.postcode)
      setLine1(result.line1)
      setCity(result.city)
    } catch {
      setLookupError('Postcode not found. Please check and try again.')
    } finally {
      setLookingUp(false)
    }
  }

  const handleOrder = async () => {
    if (!canOrder) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      // Step 1: Render pages to PDF
      setStage('rendering')
      setRenderProgress({ done: 0, total: pageCount })
      const pdfBlob = await renderBookToPdf(
        currentProject.pages,
        currentProject.title,
        (done, total) => setRenderProgress({ done, total })
      )

      // Step 2: Upload PDF to Supabase Storage
      setStage('uploading')
      const pdfPath = `${session.user.id}/${currentProject.id}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(pdfPath, pdfBlob, { contentType: 'application/pdf', upsert: true })
      if (uploadError) throw new Error('Upload failed')

      const { data: urlData } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(pdfPath, 60 * 60 * 24 * 365 * 10)
      if (!urlData?.signedUrl) throw new Error('Failed to get PDF URL')

      // Step 3: Submit order via Edge Function
      setStage('submitting')
      const { data, error: fnError } = await supabase.functions.invoke('submit-order', {
        body: {
          bookId: currentProject.id,
          bookTitle: currentProject.title,
          pdfUrl: urlData.signedUrl,
          pageCount,
          shipping: { name, line1, line2, city, postcode, countryCode: 'GB' },
        },
      })

      if (fnError || data?.error) {
        throw new Error(data?.error || 'Order submission failed')
      }

      orderPlaced(currentProject.id)
      setProdigiOrderId(data.prodigiOrderId)
      setStage('success')
    } catch (err: any) {
      console.error(err)
      setErrorMessage(err.message || 'Something went wrong')
      setStage('error')
    }
  }

  // ── Success screen ────────────────────────────────────────────
  if (stage === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-green-600" />
        </div>
        <div className="text-center">
          <p className="text-[22px] font-bold text-foreground">Order placed!</p>
          <p className="text-[13px] text-muted-foreground mt-1">{prodigiOrderId}</p>
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

  // ── Rendering / uploading / submitting overlay ────────────────
  if (stage === 'rendering' || stage === 'uploading' || stage === 'submitting') {
    const message =
      stage === 'rendering'
        ? `Preparing your book… ${renderProgress.done}/${renderProgress.total} pages`
        : stage === 'uploading'
        ? 'Uploading your book…'
        : 'Placing order…'

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-[16px] text-foreground font-medium text-center">{message}</p>
        {stage === 'rendering' && renderProgress.total > 0 && (
          <div className="w-full max-w-xs bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(renderProgress.done / renderProgress.total) * 100}%` }}
            />
          </div>
        )}
        <p className="text-[12px] text-muted-foreground text-center">
          Please keep this screen open
        </p>
      </div>
    )
  }

  // ── Error screen ──────────────────────────────────────────────
  if (stage === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <p className="text-[18px] font-bold text-foreground">Order failed</p>
          <p className="text-[13px] text-muted-foreground mt-2">{errorMessage}</p>
        </div>
        <button
          onClick={() => setStage('idle')}
          className="w-full bg-primary text-white rounded-[16px] py-4 text-[16px] font-semibold"
        >
          Try again
        </button>
      </div>
    )
  }

  // ── Idle: address form ────────────────────────────────────────
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
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Order Summary
          </p>
          <div className="flex justify-between text-[14px] text-foreground mb-2">
            <span>{currentProject.title}</span>
            <span>{pageCount} pages</span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground mb-1">
            <span>Print (A4 hardcover, gloss)</span>
            <span>£{(estimatedTotal - SHIPPING).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[13px] text-muted-foreground mb-3">
            <span>Delivery (5–7 working days)</span>
            <span>£{SHIPPING.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[15px] font-semibold text-foreground border-t border-border pt-3">
            <span>Estimated Total</span>
            <span>£{estimatedTotal.toFixed(2)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Final price confirmed at print time · incl. VAT
          </p>
        </div>

        {/* Postcode lookup */}
        <div className="bg-card border border-border rounded-[14px] p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">
              Delivery Details
            </p>
          </div>

          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full name"
            className="w-full bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
          />

          {/* Postcode lookup row */}
          <div className="flex gap-2">
            <input
              value={postcodeInput}
              onChange={e => setPostcodeInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handlePostcodeLookup()}
              placeholder="Postcode"
              className="flex-1 bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary uppercase"
            />
            <button
              onClick={handlePostcodeLookup}
              disabled={lookingUp || !postcodeInput.trim()}
              className="flex items-center gap-1.5 bg-primary disabled:opacity-40 text-white rounded-[10px] px-4 py-2.5 text-[14px] font-medium"
            >
              {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Find
            </button>
          </div>
          {lookupError && (
            <p className="text-[12px] text-red-500">{lookupError}</p>
          )}

          {/* Address fields (shown after lookup) */}
          {line1 && (
            <>
              <input
                value={line1}
                onChange={e => setLine1(e.target.value)}
                placeholder="Address line 1"
                className="w-full bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
              <input
                value={line2}
                onChange={e => setLine2(e.target.value)}
                placeholder="Address line 2 (optional)"
                className="w-full bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Town / city"
                  className="flex-1 bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                />
                <input
                  value={postcode}
                  onChange={e => setPostcode(e.target.value.toUpperCase())}
                  placeholder="Postcode"
                  className="w-[120px] bg-background border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary uppercase"
                />
              </div>
              <input
                value="United Kingdom"
                readOnly
                className="w-full bg-muted border border-border rounded-[10px] px-3 py-2.5 text-[14px] text-muted-foreground cursor-not-allowed"
              />
            </>
          )}
        </div>
      </div>

      {/* Place order button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4 bg-background border-t border-border">
        <button
          onClick={handleOrder}
          disabled={!canOrder}
          className="w-full bg-primary disabled:opacity-40 text-white rounded-[16px] py-4 text-[16px] font-semibold"
        >
          Place Order · £{estimatedTotal.toFixed(2)}
        </button>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Estimated price · confirmed at print time
        </p>
      </div>
    </div>
  )
}

export default Checkout
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Checkout.tsx
git commit -m "feat: rewrite Checkout with postcode lookup, rendering progress, and Prodigi submission"
```

---

## Task 10: Clean Up Env Vars

**Files:** `.env.local`, `.env.example`

- [ ] **Step 1: Remove browser-exposed Prodigi vars from `.env.local`**

Remove these two lines:
```
VITE_PRODIGI_API_KEY=4299e2cb-dcbc-4493-80e9-f572f5c8012b
VITE_PRODIGI_BOOK_SKU=BOOK-FE-A4-L-HARD-G
```

Keep `VITE_PRODIGI_API_URL` for reference (the Edge Function uses its own constant, but this documents the environment).

- [ ] **Step 2: Remove from `.env.example`**

Remove:
```
VITE_PRODIGI_API_KEY=your-prodigi-api-key-here
VITE_PRODIGI_BOOK_SKU=BOOK-FE-A4-L-HARD-G
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: remove browser-exposed Prodigi API key (now in Edge Function secrets)"
```

Note: `.env.local` is gitignored — no need to add it.

---

## Task 11: Manual End-to-End Test

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
bun run dev
```

- [ ] **Step 2: Open a book in the editor**

Go to Home → pick any book with pages → tap Order.

- [ ] **Step 3: Test postcode lookup**

Enter a UK postcode (e.g. `EC1A 1BB`) → tap Find. Verify address fields appear and are populated correctly.

- [ ] **Step 4: Fill in name and place order**

Enter a full name → tap "Place Order". Verify:
- Progress bar appears with page count incrementing
- "Uploading your book…" screen appears
- "Placing order…" screen appears
- Success screen shows with a Prodigi order ID (format: `ord_...`)

- [ ] **Step 5: Verify in Prodigi dashboard**

Go to `dashboard.prodigi.com` → All orders. The new order should appear with status "In Progress".

- [ ] **Step 6: Verify in Supabase**

Go to Supabase → Table Editor → `orders`. The new row should have:
- `prodigi_order_id` populated
- `pdf_url` populated
- `shipping_name` populated
- `shipping_address` as JSON

- [ ] **Step 7: Verify book status**

Go back to Home. The ordered book should show as "ordered" status.

---

## Self-Review Checklist

- ✅ All spec sections covered: rendering, postcode lookup, Edge Function, DB migration, env cleanup, pricing
- ✅ No TBDs or placeholders — all code is complete
- ✅ Types consistent: `ShippingAddress` interface matches between Checkout and Edge Function
- ✅ `orderPlaced(id)` defined in Task 8, used in Task 9 Checkout
- ✅ `lookupPostcode` defined in Task 4, imported in Task 9
- ✅ `renderBookToPdf` defined in Task 5, imported in Task 9
- ✅ `supabase.functions.invoke('submit-order', ...)` matches function name in Task 6
- ✅ Security: API key in Supabase secret, not VITE_ env var
- ✅ Error states handled in Checkout (render fail, upload fail, order reject)
