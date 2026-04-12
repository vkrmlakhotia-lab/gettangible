# Sign-In Design Spec
**Date:** 2026-04-12
**Status:** Approved

---

## Overview

Add Apple and Google sign-in to Tangible. Sign-in is deliberately deferred until after the user has seen their book layout — value first, account second. The sign-in UI is a reusable bottom sheet component triggered from the layout page.

---

## Section 1: Sign-In Sheet (`SignInSheet.tsx`)

A bottom sheet component placed in `src/components/SignInSheet.tsx`.

**Visual design** (matches Figma frame `03 · Sign In`, node `3:20`):
- Teal rounded "T" logo at top centre
- Heading: **"Welcome to Tangible"** in slate (`#577590`), 24px
- Subtitle: **"Sign in to save your progress"** in dark grey (`#333`), 13px
- **"Continue with Apple"** — full-width, slate (`#577590`) filled button, rounded-xl, white text, Apple logo icon
- **"Continue with Google"** — full-width, white button with `#d9d9d9` border, rounded-xl, slate text, Google logo icon
- Legal line at bottom: *"By continuing you agree to our Terms of Service and Privacy Policy"* in small grey text
- Semi-transparent backdrop behind the sheet; tapping outside dismisses it

**Behaviour:**
- Accepts an `onClose` prop — called when dismissed or after successful sign-in
- Calls `useAuth().signIn('apple')` or `useAuth().signIn('google')` on button tap
- Shows a loading state on the tapped button while the OAuth redirect is in flight
- After successful sign-in, `onClose` is called and the sheet unmounts

**Props:**
```ts
interface SignInSheetProps {
  isOpen: boolean
  onClose: () => void
  onSignedIn?: () => void  // optional callback after successful sign-in
}
```

---

## Section 2: Layout Page CTA

On the book layout/preview page, the primary action button at the bottom adapts to auth state:

| Auth state | Button label | Action |
|---|---|---|
| Not signed in | "Sign in to save your progress" | Opens `SignInSheet` |
| Signed in | "Order Now" | Navigates to checkout |

After sign-in completes (`onSignedIn` callback), the sheet closes and the user can proceed to checkout.

---

## Section 3: Routing — Returning Users

### `localStorage` flag

When a user successfully authenticates for the first time, write `hasSignedInBefore = "true"` to `localStorage`. This persists across app restarts and session expiry.

### `Index.tsx` routing logic

```
isLoading → show splash / wait

isAuthenticated          → navigate to /home
!isAuthenticated
  + hasSignedInBefore    → navigate to /home
  + no flag              → navigate to /onboarding
```

### Home page — unauthenticated returning user

When a returning user lands on `/home` without an active session, their Supabase queries return empty (no books). The home page shows its standard empty state plus a small **"Sign back in to access your books"** banner that opens `SignInSheet`.

This banner is only shown when:
- `isAuthenticated === false`
- `localStorage.getItem('hasSignedInBefore') === 'true'`

---

## Files to Create / Modify

| File | Change |
|---|---|
| `src/components/SignInSheet.tsx` | **New** — bottom sheet with Apple + Google sign-in |
| `src/pages/Index.tsx` | **Modify** — routing logic to use `hasSignedInBefore` flag |
| `src/context/AuthContext.tsx` | **Modify** — write `hasSignedInBefore` to localStorage on first sign-in |
| `src/pages/HomePage.tsx` | **Modify** — show "sign back in" banner for unauthenticated returning users |
| Layout page component | **Modify** — replace/add primary CTA button with auth-aware behaviour |

> **Note:** The layout page component needs to be confirmed during implementation — likely `PhotobookPreview.tsx` or `FlipBook.tsx`.

---

## What Is NOT in Scope

- The "Already have an account? Sign in" link on the onboarding welcome screen — it remains as-is (non-functional) for now. Returning users are routed to `/home` directly.
- Sign-out flow — already exists in the Account page.
- Any changes to the onboarding flow beyond the routing update.
