# Create Flow + Photos.framework — Design Spec
**Date:** 2026-04-14
**Status:** Approved

---

## Overview

Complete the missing and disconnected screens from the Figma wireframes (April 2026), and replace the generic `@capacitor/camera` photo picker with a native Swift plugin that uses Apple's `Photos.framework`. This gives the app access to richer photo metadata on-device, powering smarter filtering without any server cost.

**Screens covered:** 08 (Category Selection), 09 (Scanning Library), 10 (Filters), 11 (Photo Selection), 16 (Order Confirmation), 19 (Order Tracking).

---

## Architecture

### Before

- `ApplePhotosImport.tsx` opens the generic iOS photo picker (`@capacitor/camera`)
- EXIF data is parsed from selected files in JavaScript (`exifr`)
- Clustering and filtering run on whatever metadata survived the EXIF parse
- `OrderConfirmation` and `OrderTracking` components exist but are not wired up

### After

- A new native Swift plugin (`TangiblePhotosPlugin`) queries `Photos.framework` directly
- The plugin returns enriched metadata per photo — date, GPS, favourites, screenshot flag, burst flag, face count
- `ApplePhotosImport.tsx` calls the plugin instead of the file picker, uses the richer data for all filtering/clustering steps
- `OrderConfirmation` is wired into `Checkout.tsx` post-order state
- A new `/order-tracking` route and `OrderTrackingPage.tsx` wrapper make Order Tracking accessible from Account

---

## Part 1 — Swift Capacitor Plugin

### Files

| File | Purpose |
|------|---------|
| `ios/App/App/TangiblePhotosPlugin.swift` | Main plugin — fetches photos, returns JSON |
| `ios/App/App/TangiblePhotosPlugin.m` | Objective-C bridge (Capacitor requirement, ~5 lines) |
| `ios/App/App/AppDelegate.swift` | Register plugin (add one line) |
| `src/lib/tangiblePhotos.ts` | TypeScript wrapper — calls the plugin or falls back to web |

### Plugin Method: `fetchPhotos`

Called from React. Returns a promise that resolves to an array of photo objects.

**Input:** none (permission is requested inside the plugin)

**Output per photo:**
```ts
{
  localIdentifier: string   // unique iOS photo ID
  uri: string               // web-accessible image URL
  date: string              // ISO 8601 date string, e.g. "2024-07-15T14:32:00Z"
  lat: number | null
  lon: number | null
  isFavourite: boolean
  isScreenshot: boolean
  isBurst: boolean
  faceCount: number         // 0 if no face data available
  width: number
  height: number
}
```

### Permission handling

- Plugin requests `NSPhotoLibraryUsageDescription` permission natively
- If denied → returns `{ error: 'denied' }` — React shows the existing denied screen
- If granted (full or limited) → proceeds with fetch

### Fallback (web / Android)

`src/lib/tangiblePhotos.ts` detects whether the plugin is available. If not (web browser, Android, simulator without plugin), it falls back to the existing `@capacitor/camera` picker. The rest of the app works unchanged in both cases.

### Info.plist

Add `NSPhotoLibraryUsageDescription` key with value:
> "Tangible needs access to your photos to create your book. Your photos stay on your device."

---

## Part 2 — Create Flow UI (ApplePhotosImport.tsx)

`ApplePhotosImport.tsx` keeps all existing logic (clustering, filtering, date range, people). The JSX for each step is rewritten to match the Figma. The `Step` type gains one new value: `'scanning'` replaces `'uploading'` to better reflect what's happening.

### Step: Permission

Minor restyling only — apply Sunflower Groove tokens (teal button, correct typography). No structural change. Kept for returning users who reach Create without going through onboarding.

### Step: Category Selection (Screen 08)

Four full-width cards in a scrollable list:

| Category | Icon | Subtitle |
|----------|------|---------|
| Recent Trips | MapPin | "Group by location — perfect for holidays" |
| Events | Calendar | "Birthdays, weddings, gatherings by date" |
| Certain People | Users | "Photos featuring specific family or friends" |
| Time Frame | Clock | "Choose from a specific date range" |

Tapping a card calls the plugin (`fetchPhotos`), sets the selected category, and advances to `scanning`.

### Step: Scanning Library (Screen 09)

Animated checklist — five rows that activate in sequence as data arrives:

1. Reading photo metadata
2. Detecting faces & people
3. Clustering by date & location
4. Scoring photo quality
5. Filtering duplicates & screenshots

Each row shows a filled teal circle with checkmark when done, an empty circle while pending. A spinner sits above the list. The checklist ticks through as plugin data is processed — steps 1–2 complete when the plugin resolves, steps 3–5 complete as clustering and filtering run in JS.

### Step: Options (existing, no UI change)

After scanning, users pick which specific trip / event / date range / person. This step already exists and is functional. No UI change in this pass.

**People category note:** The plugin returns `faceCount` per photo (a number, not a name). The existing "Certain People" options step shows a text input for a person's name — this stays as-is for now. Mapping face counts to named people requires Face ID / People album integration, which is deferred. For this pass, "Certain People" shows all photos where `faceCount > 0`.

### Step: Filters (Screen 10)

Four toggle rows with live summary banner:

| Filter | Default | Subtitle source |
|--------|---------|----------------|
| Remove screenshots | ON | "Detected N screenshots" (from plugin data) |
| Remove blurry photos | ON | "Quality threshold: medium" |
| Remove near-duplicates | ON | "Detected N duplicates" (from burst flag) |
| Include selfies | OFF | "N selfies detected" (from faceCount > 0) |

Summary banner below: "✓ N photos shortlisted for your book — We'll auto-arrange them, you can edit later"

Primary button: "Review & Select Photos →"

### Step: Photo Selection (Screen 11)

- Photos grouped by date, sorted newest first
- 3-column grid, 2px gap
- Selected photos show a filled teal circle checkmark overlay (top-right corner)
- Unselected photos show an empty circle
- "Select All" / "Deselect All" button per date group
- Sticky bottom bar: count ("287 selected") + "Continue" CTA in orange
- All photos pre-selected when step opens

`ShortlistedPhotos.tsx` is deleted — its drag-to-reorder functionality is not in the Figma and adds complexity. It is not used anywhere.

---

## Part 3 — Order Confirmation (Screen 16)

`Checkout.tsx` has an inline post-order state (lines 49–80) that shows a basic green icon. This is replaced by the existing `OrderConfirmation` component.

**Change in `Checkout.tsx`:**
- Import `OrderConfirmation`
- When `ordered === true`, render `<OrderConfirmation>` with real props (title, pageCount, total)
- `onViewOrders` navigates to `/order-tracking`
- `onBackHome` navigates to `/home`
- Delete the inline post-order JSX

No changes to `OrderConfirmation.tsx`.

---

## Part 4 — Order Tracking (Screen 19)

### New files

**`src/pages/OrderTrackingPage.tsx`**
Thin wrapper page. Reads the most recently ordered project from `BookContext`, extracts title, page count, total, and cover photo URL, and passes them to `OrderTracking`. If no ordered project exists, navigates back to `/account`.

### Changes to existing files

**`src/App.tsx`**
Add route: `<Route path="/order-tracking" element={<OrderTrackingPage />} />`

**`src/components/OrderTracking.tsx`**
Minor update — ensure it uses real props for title, total, and cover URL rather than hardcoded values. Timeline steps stay as estimated dates (Prodigi not yet integrated).

---

## What is NOT in scope

- Prodigi API integration — order tracking timeline remains estimated
- NIMA / server-side ML quality scoring — deferred
- Google Photos — cut from MVP
- Drag-to-reorder in photo selection — not in Figma, deferred

---

## Files changed

| File | Change |
|------|--------|
| `ios/App/App/TangiblePhotosPlugin.swift` | **New** |
| `ios/App/App/TangiblePhotosPlugin.m` | **New** |
| `ios/App/App/AppDelegate.swift` | Add plugin registration |
| `ios/App/App/Info.plist` | Add photo usage description |
| `src/lib/tangiblePhotos.ts` | **New** — TS wrapper with web fallback |
| `src/components/ApplePhotosImport.tsx` | Rewrite step JSX, call plugin |
| `src/components/ShortlistedPhotos.tsx` | **Deleted** |
| `src/pages/Checkout.tsx` | Replace inline post-order state |
| `src/pages/OrderTrackingPage.tsx` | **New** — wrapper page |
| `src/App.tsx` | Add `/order-tracking` route |
| `src/components/OrderTracking.tsx` | Minor — use real props |
