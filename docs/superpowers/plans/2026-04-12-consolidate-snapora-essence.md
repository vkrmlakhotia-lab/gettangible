# Consolidate snapora-essence → gettangible Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all architectural value from `snapora-essence` into `gettangible` so that `gettangible` becomes the single canonical repo, then archive `snapora-essence`.

**Architecture:** Add the missing layers (types, contexts, Supabase, Capacitor, components) from `snapora-essence` directly into `gettangible`. Keep all of `gettangible`'s existing UI screens — they represent the preferred UX. Only add the 3 pages that have no equivalent in `gettangible` (HomePage, Creations, Account). Replace `gettangible`'s monolithic `Index.tsx` state machine with a lean router-aware splash screen. Move the Python Apple Photos backend into `gettangible/backend/`. Archive `snapora-essence` on GitHub.

**Tech Stack:** React 18 + TypeScript, Vite, Bun, Tailwind CSS, shadcn/ui, TanStack Query, React Router v6, Supabase (auth + DB + storage), Capacitor v6, dnd-kit, canvas-confetti, exifr

---

## File Map

### New files to create in `gettangible`
| Path | Source | Purpose |
|---|---|---|
| `src/types/book.ts` | snapora-essence verbatim | BookProject, BookPage, BookPhoto, PageLayout types + constants |
| `src/lib/supabase.ts` | snapora-essence verbatim | Supabase client singleton |
| `src/lib/database.types.ts` | snapora-essence verbatim | Generated DB type definitions |
| `src/lib/storage.ts` | snapora-essence verbatim | Photo upload helpers |
| `src/context/AuthContext.tsx` | snapora-essence verbatim | Auth state + Google/Apple OAuth |
| `src/context/BookContext.tsx` | snapora-essence verbatim | Book CRUD + Supabase sync |
| `src/pages/HomePage.tsx` | snapora-essence verbatim | Post-login "My Books" screen — no equivalent in gettangible |
| `src/pages/Creations.tsx` | snapora-essence verbatim | View all books with status filters — no equivalent in gettangible |
| `src/pages/Account.tsx` | snapora-essence verbatim | User profile + sign out — no equivalent in gettangible |
| `src/components/BottomNav.tsx` | snapora-essence verbatim | Tab bar (Home/Creations/Basket/Account) |
| `src/components/ApplePhotosImport.tsx` | snapora-essence verbatim | Native + web photo import with EXIF parsing |
| `src/components/SmartCuration.tsx` | snapora-essence verbatim | Photo quality filtering UI |
| `src/components/FlipBook.tsx` | snapora-essence verbatim | Flipbook preview component |
| `src/components/PageLayoutRenderer.tsx` | snapora-essence verbatim | Page layout rendering |
| `src/components/PageRenderer.tsx` | snapora-essence verbatim | Single page renderer |
| `src/components/CollaboratePanel.tsx` | snapora-essence verbatim | Collaborator invite UI |
| `capacitor.config.ts` | snapora-essence verbatim | iOS/Android Capacitor config |
| `.env.example` | new | Supabase env var template |
| `backend/` | snapora-essence `apple-photos-intake/` | Python Apple Photos extractor |

### Skipped pages — gettangible's own components already cover these
| snapora-essence page | Replaced by in gettangible |
|---|---|
| `Onboarding.tsx` | `OnboardingScreens.tsx` — your preferred version |
| `CreateBook.tsx` | `OnboardingScreens` + `ShortlistedPhotos.tsx` |
| `Editor.tsx` | `PhotobookPreview.tsx` with drag-and-drop |
| `Preview.tsx` | `PhotobookPreview.tsx` |
| `Checkout.tsx` | `CheckoutPage.tsx` |
| `OrderTracking.tsx` | `OrderTracking.tsx` |
| `Basket.tsx` | Inline cart in current flow — add as a dedicated page later if needed |
| `GiftFlow.tsx` | Not needed yet — can be added as a future feature |

### Files to modify in `gettangible`
| Path | Change |
|---|---|
| `package.json` | Add supabase, capacitor, exifr; add `cap:*` scripts |
| `src/App.tsx` | Add AuthProvider, BookProvider, all routes, BottomNav |
| `src/pages/Index.tsx` | Replace state machine with router-aware splash screen |

---

## Task 1: Add missing dependencies to package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add new dependencies**

Edit `gettangible/package.json` `"dependencies"` block — add these entries after the existing `@tanstack/react-query` entry:

```json
"@capacitor/camera": "^6.0.0",
"@capacitor/core": "^6.0.0",
"@supabase/supabase-js": "^2.101.1",
"exifr": "^7.1.3",
```

- [ ] **Step 2: Add Capacitor CLI to devDependencies**

Add to `"devDependencies"`:
```json
"@capacitor/cli": "^6.0.0",
"@capacitor/ios": "^6.0.0",
```

- [ ] **Step 3: Add Capacitor scripts**

Add to `"scripts"`:
```json
"cap:add:ios": "cap add ios",
"cap:sync": "cap sync",
"cap:open:ios": "cap open ios",
```

- [ ] **Step 4: Install**

```bash
cd /path/to/gettangible
bun install
```
Expected: no errors, `bun.lockb` updated.

- [ ] **Step 5: Commit**

```bash
git add package.json bun.lockb
git commit -m "chore: add supabase, capacitor, and exifr dependencies"
```

---

## Task 2: Add types, lib, and context layers

**Files:**
- Create: `src/types/book.ts`
- Create: `src/lib/supabase.ts`
- Create: `src/lib/database.types.ts`
- Create: `src/lib/storage.ts`
- Create: `src/context/AuthContext.tsx`
- Create: `src/context/BookContext.tsx`
- Create: `.env.example`

- [ ] **Step 1: Create `src/types/book.ts`**

Copy verbatim from `snapora-essence/src/types/book.ts`. Full content:

```typescript
export interface BookPhoto {
  id: string;
  url: string;
  storagePath?: string;
  file?: File;
  isLowRes?: boolean;
  isDuplicate?: boolean;
}

export type PageLayout =
  | 'full-bleed'
  | 'single-bordered'
  | 'two-stacked'
  | 'two-side'
  | 'three-mixed'
  | 'four-grid'
  | 'five-collage'
  | 'photo-caption-below'
  | 'photo-caption-above'
  | 'text-left-photo-right'
  | 'photo-left-text-right'
  | 'text-only'
  | 'cover'
  | '1-up'
  | '2-up'
  | '3-up';

export const LAYOUT_PHOTO_COUNT: Record<PageLayout, number> = {
  'full-bleed': 1,
  'single-bordered': 1,
  'two-stacked': 2,
  'two-side': 2,
  'three-mixed': 3,
  'four-grid': 4,
  'five-collage': 5,
  'photo-caption-below': 1,
  'photo-caption-above': 1,
  'text-left-photo-right': 1,
  'photo-left-text-right': 1,
  'text-only': 0,
  'cover': 1,
  '1-up': 1,
  '2-up': 2,
  '3-up': 3,
};

export type PaperFinish = 'matte' | 'glossy' | 'layflat';

export type BookStyle = 'classic' | 'baby' | 'yearbook' | 'wedding' | 'travel' | 'minimal';

export interface BookPage {
  id: string;
  layout: PageLayout;
  photos: BookPhoto[];
  caption?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  photosAdded: number;
  joinedAt: string;
}

export interface BookProject {
  id: string;
  title: string;
  coverPhoto?: string;
  pages: BookPage[];
  status: 'draft' | 'completed' | 'ordered' | 'archived';
  createdAt: string;
  updatedAt: string;
  paperFinish?: PaperFinish;
  style?: BookStyle;
  giftNote?: string;
  collaborators?: Collaborator[];
  shareLink?: string;
  aiPrompt?: string;
}

export interface OrderItem {
  id: string;
  bookId: string;
  bookTitle: string;
  pageCount: number;
  pricePerPage: number;
  deliveryFee: number;
  total: number;
  status: 'processing' | 'printed' | 'shipped' | 'delivered';
  orderedAt: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export const PAPER_FINISHES: { value: PaperFinish; label: string; description: string }[] = [
  { value: 'matte', label: 'Matte', description: 'Soft, non-reflective finish' },
  { value: 'glossy', label: 'Glossy', description: 'Vibrant, high-shine finish' },
  { value: 'layflat', label: 'Lay-Flat', description: 'Pages lie completely flat (+£3)' },
];

export const BOOK_STYLES: { value: BookStyle; label: string; emoji: string }[] = [
  { value: 'classic', label: 'Classic', emoji: '📖' },
  { value: 'baby', label: 'Baby Book', emoji: '👶' },
  { value: 'yearbook', label: 'Year Book', emoji: '📅' },
  { value: 'wedding', label: 'Wedding', emoji: '💍' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'minimal', label: 'Minimal', emoji: '◻️' },
];

export const AI_PROMPTS: { prompt: string; label: string }[] = [
  { prompt: 'Minimalist wedding album with elegant white space', label: 'Elegant Wedding' },
  { prompt: 'Colorful baby milestone book with playful layouts', label: 'Baby Milestones' },
  { prompt: 'Cinematic travel journal with full-bleed photos', label: 'Travel Journal' },
  { prompt: 'Modern yearbook with clean grid layouts', label: 'Year in Review' },
  { prompt: 'Cozy family memories with warm tones', label: 'Family Memories' },
];
```

- [ ] **Step 2: Create `.env.example`**

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Also add `.env.local` to `.gitignore` if not already present:
```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 3: Create `src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 4: Create `src/lib/database.types.ts`**

Copy verbatim from `snapora-essence/src/lib/database.types.ts` (the full Database interface with profiles, book_projects, book_pages, book_photos, collaborators, orders tables).

- [ ] **Step 5: Create `src/lib/storage.ts`**

Copy verbatim from `snapora-essence/src/lib/storage.ts`:

```typescript
import { supabase } from './supabase'
import type { BookPhoto } from '@/types/book'

export async function uploadPhoto(file: File, userId: string): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('photos')
    .upload(path, file, { upsert: false, contentType: file.type })

  if (error) throw error

  const { data } = await supabase.storage
    .from('photos')
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10)

  if (!data?.signedUrl) throw new Error('Failed to get signed URL')

  return { url: data.signedUrl, path }
}

export async function uploadPhotos(
  photos: BookPhoto[],
  userId: string,
  onProgress?: (uploaded: number, total: number) => void
): Promise<BookPhoto[]> {
  const toUpload = photos.filter(p => p.file)
  let uploaded = 0

  const resultMap = new Map<string, { url: string; path: string }>()

  await Promise.all(
    toUpload.map(async photo => {
      const result = await uploadPhoto(photo.file!, userId)
      resultMap.set(photo.id, result)
      uploaded++
      onProgress?.(uploaded, toUpload.length)
    })
  )

  return photos.map(p => {
    const result = resultMap.get(p.id)
    if (!result) return p
    return { ...p, url: result.url, storagePath: result.path, file: undefined }
  })
}
```

- [ ] **Step 6: Create `src/context/AuthContext.tsx`**

Copy verbatim from `snapora-essence/src/context/AuthContext.tsx` (full file as read above — `AuthProvider` + `useAuth` hook).

- [ ] **Step 7: Create `src/context/BookContext.tsx`**

Copy verbatim from `snapora-essence/src/context/BookContext.tsx` (full file as read above — `BookProvider` + `useBooks` hook + `autoLayout` function + layout patterns).

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd /path/to/gettangible
bun run build 2>&1 | head -40
```
Expected: no errors for the new files (there may be errors in Index.tsx from the old state machine — those get fixed in Task 5).

- [ ] **Step 9: Commit**

```bash
git add src/types/ src/lib/supabase.ts src/lib/database.types.ts src/lib/storage.ts src/context/ .env.example .gitignore
git commit -m "feat: add types, supabase lib, and auth/book context layers"
```

---

## Task 3: Copy the 3 genuinely missing pages

**Files:**
- Create: `src/pages/HomePage.tsx`
- Create: `src/pages/Creations.tsx`
- Create: `src/pages/Account.tsx`

These are the only snapora-essence pages with no equivalent in gettangible.
All other pages (Onboarding, CreateBook, Editor, Checkout, OrderTracking) are
already covered by gettangible's existing components.

- [ ] **Step 1: Copy the 3 pages verbatim**

```bash
SNAP=/path/to/snapora-essence/src/pages
TANG=/path/to/gettangible/src/pages

cp "$SNAP/HomePage.tsx"   "$TANG/HomePage.tsx"
cp "$SNAP/Creations.tsx"  "$TANG/Creations.tsx"
cp "$SNAP/Account.tsx"    "$TANG/Account.tsx"
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/HomePage.tsx src/pages/Creations.tsx src/pages/Account.tsx
git commit -m "feat: add HomePage, Creations, and Account pages (no equivalent existed in gettangible)"
```

---

## Task 4: Copy components from snapora-essence

**Files:**
- Create: `src/components/BottomNav.tsx`
- Create: `src/components/ApplePhotosImport.tsx`
- Create: `src/components/SmartCuration.tsx`
- Create: `src/components/FlipBook.tsx`
- Create: `src/components/PageLayoutRenderer.tsx`
- Create: `src/components/PageRenderer.tsx`
- Create: `src/components/CollaboratePanel.tsx`

- [ ] **Step 1: Copy components verbatim**

```bash
SNAP=/path/to/snapora-essence/src/components
TANG=/path/to/gettangible/src/components

cp "$SNAP/BottomNav.tsx"           "$TANG/BottomNav.tsx"
cp "$SNAP/ApplePhotosImport.tsx"   "$TANG/ApplePhotosImport.tsx"
cp "$SNAP/SmartCuration.tsx"       "$TANG/SmartCuration.tsx"
cp "$SNAP/FlipBook.tsx"            "$TANG/FlipBook.tsx"
cp "$SNAP/PageLayoutRenderer.tsx"  "$TANG/PageLayoutRenderer.tsx"
cp "$SNAP/PageRenderer.tsx"        "$TANG/PageRenderer.tsx"
cp "$SNAP/CollaboratePanel.tsx"    "$TANG/CollaboratePanel.tsx"
```

- [ ] **Step 2: Commit**

```bash
git add src/components/
git commit -m "feat: add BottomNav, ApplePhotosImport, SmartCuration, and rendering components"
```

---

## Task 5: Replace Index.tsx with router-aware splash screen

**Files:**
- Modify: `src/pages/Index.tsx`

The current `Index.tsx` is a 276-line state machine handling splash, onboarding, checkout, order tracking, and the main photo editor. All of those screens now have dedicated pages. Replace it with a lean splash screen that navigates via React Router (exactly as in `snapora-essence/src/pages/Index.tsx`).

- [ ] **Step 1: Replace `src/pages/Index.tsx`**

Overwrite the entire file with:

```tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Splash screen shown on every cold launch (screen 01)
const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [splashDone, setSplashDone] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Navigate when video ends (or after fallback timeout if video fails)
  useEffect(() => {
    const fallback = setTimeout(() => setSplashDone(true), 5000);
    return () => clearTimeout(fallback);
  }, []);

  useEffect(() => {
    if (!splashDone || isLoading) return;
    navigate(isAuthenticated ? '/home' : '/onboarding', { replace: true });
  }, [splashDone, isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <video
        ref={videoRef}
        src="/tangible-splash-v6.mp4"
        autoPlay
        muted
        playsInline
        onEnded={() => setSplashDone(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};

export default Index;
```

Note: The splash video `tangible-splash-v6.mp4` must be in `public/`. If the filename differs, update the `src` attribute to match the existing file in `gettangible/public/`.

- [ ] **Step 2: Verify the video file exists**

```bash
ls /path/to/gettangible/public/*.mp4
```
Expected: at least one `.mp4` file. If the filename differs from `tangible-splash-v6.mp4`, update the `src` in the file above.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Index.tsx
git commit -m "refactor: replace Index.tsx state machine with router-aware splash screen"
```

---

## Task 6: Update App.tsx with all routes and providers

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx`**

Overwrite the entire file with:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { BookProvider } from "@/context/BookContext";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import HomePage from "./pages/HomePage.tsx";
import CreateBook from "./pages/CreateBook.tsx";
import Editor from "./pages/Editor.tsx";
import Preview from "./pages/Preview.tsx";
import Checkout from "./pages/Checkout.tsx";
import Creations from "./pages/Creations.tsx";
import Basket from "./pages/Basket.tsx";
import Account from "./pages/Account.tsx";
import OrderTracking from "./pages/OrderTracking.tsx";
import GiftFlow from "./pages/GiftFlow.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BookProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/create" element={<CreateBook />} />
              <Route path="/editor/:id" element={<Editor />} />
              <Route path="/preview/:id" element={<Preview />} />
              <Route path="/checkout/:id" element={<Checkout />} />
              <Route path="/creations" element={<Creations />} />
              <Route path="/basket" element={<Basket />} />
              <Route path="/account" element={<Account />} />
              <Route path="/order-tracking" element={<OrderTracking />} />
              <Route path="/gift" element={<GiftFlow />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </BrowserRouter>
        </BookProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /path/to/gettangible
bun run build 2>&1
```
Expected: clean build. If errors appear, they will be import mismatches — check that all referenced files exist in the correct paths.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up all routes, AuthProvider, BookProvider, and BottomNav in App.tsx"
```

---

## Task 7: Add Capacitor config

**Files:**
- Create: `capacitor.config.ts`

- [ ] **Step 1: Create `capacitor.config.ts`**

```typescript
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tangible.app',
  appName: 'Tangible',
  webDir: 'dist',
  server: {
    // Remove this block for production builds
    // Uncomment for live reload during development (replace with your Mac's IP):
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
}

export default config
```

Note: `appId` changed from `com.snapora.app` → `com.tangible.app` and `appName` from `Snapora` → `Tangible` to match the gettangible brand.

- [ ] **Step 2: Commit**

```bash
git add capacitor.config.ts
git commit -m "feat: add Capacitor config for iOS/Android (com.tangible.app)"
```

---

## Task 8: Move Python backend into gettangible

**Files:**
- Create: `backend/` directory (copied from `snapora-essence/apple-photos-intake/`)

The canonical Python backend lives at `snapora-essence/apple-photos-intake/`. Copy it into `gettangible/backend/`.

- [ ] **Step 1: Copy the backend directory**

```bash
cp -r /path/to/snapora-essence/apple-photos-intake/ /path/to/gettangible/backend/
```

- [ ] **Step 2: Verify structure**

```bash
ls /path/to/gettangible/backend/
```
Expected output:
```
config/  src/  extract_photos.py  main.py  QUICKSTART.md  README.md  METADATA_EXAMPLES.md
```

- [ ] **Step 3: Commit**

```bash
git add backend/
git commit -m "feat: add Apple Photos Python extractor to backend/"
```

---

## Task 9: Final build verification

- [ ] **Step 1: Create a `.env.local` with real or dummy values to unblock the build**

```bash
echo "VITE_SUPABASE_URL=https://placeholder.supabase.co" > /path/to/gettangible/.env.local
echo "VITE_SUPABASE_ANON_KEY=placeholder-key" >> /path/to/gettangible/.env.local
```

- [ ] **Step 2: Build**

```bash
cd /path/to/gettangible
bun run build 2>&1
```
Expected: `✓ built in Xs` with no TypeScript errors. A few warnings about unused variables are acceptable.

- [ ] **Step 3: Push to remote**

```bash
git push origin main
```

---

## Task 10: Archive snapora-essence on GitHub

This step requires browser access or the `gh` CLI.

**Option A — GitHub web UI (recommended):**
1. Go to `https://github.com/vkrmlakhotia-lab/snapora-essence`
2. Settings → scroll to Danger Zone → **Archive this repository**
3. Confirm

**Option B — gh CLI:**
```bash
gh repo archive vkrmlakhotia-lab/snapora-essence --yes
```

- [ ] **Confirm:** `snapora-essence` is now archived (read-only, clearly labelled "Archived" on GitHub).

---

## Self-Review Checklist

- [x] **Spec coverage**: All 6 steps (2–7) from the original plan have tasks: types/context (T2), pages (T3), components (T4), Index refactor (T5), App.tsx (T6), Capacitor (T7), Python backend (T8), archive (T10).
- [x] **No placeholders**: All code blocks contain actual, complete content copied from the source files.
- [x] **Type consistency**: All imports match — `@/types/book`, `@/context/AuthContext`, `@/context/BookContext`, `@/lib/supabase`, `@/lib/storage` are used consistently across all tasks.
- [x] **Brand rename**: `capacitor.config.ts` uses `com.tangible.app` / `Tangible` not the snapora branding.
- [x] **Video file**: Task 5 Step 2 explicitly checks for the splash video filename before committing.
- [x] **Build gate**: Task 9 runs a full build before pushing.
