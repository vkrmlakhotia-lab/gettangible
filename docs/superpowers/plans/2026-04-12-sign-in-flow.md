# Sign-In Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Apple and Google sign-in as a bottom sheet triggered from the book layout page, with smart routing for returning users.

**Architecture:** A reusable `SignInSheet` bottom sheet component (matching Figma `03 · Sign In`) is triggered from the bottom of `PhotobookPreview`. Auth context writes a `hasSignedInBefore` flag to localStorage on first sign-in, used by the splash router to skip onboarding for returning users.

**Tech Stack:** React 18, TypeScript, Supabase OAuth, Tailwind CSS, Vitest + @testing-library/react

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/SignInSheet.tsx` | **Create** | Bottom sheet UI — Apple + Google buttons, Figma design |
| `src/components/SignInSheet.test.tsx` | **Create** | Unit tests for SignInSheet |
| `src/context/AuthContext.tsx` | **Modify** — lines 30-34 | Write `hasSignedInBefore` to localStorage on `SIGNED_IN` event |
| `src/pages/Index.tsx` | **Modify** — lines 16-19 | Route returning users to `/home` instead of `/onboarding` |
| `src/pages/Index.test.tsx` | **Create** | Unit tests for routing logic |
| `src/pages/HomePage.tsx` | **Modify** — lines 21-69 (empty state block) | Show "sign back in" banner for unauthenticated returning users |
| `src/components/PhotobookPreview.tsx` | **Modify** — after line 604 (return, before closing div) | Add auth-aware CTA button + wire up SignInSheet |
| `src/components/SaveBookScreen.tsx` | **Delete** | Unused — superseded by SignInSheet |

---

## Task 1: Create SignInSheet component

**Files:**
- Create: `src/components/SignInSheet.tsx`
- Create: `src/components/SignInSheet.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/SignInSheet.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockSignIn = vi.fn()

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}))

// Import AFTER mock is set up
const { default: SignInSheet } = await import('@/components/SignInSheet')

describe('SignInSheet', () => {
  beforeEach(() => {
    mockSignIn.mockClear()
  })

  it('renders nothing when isOpen is false', () => {
    render(<SignInSheet isOpen={false} onClose={() => {}} />)
    expect(screen.queryByText('Welcome to Tangible')).not.toBeInTheDocument()
  })

  it('renders sign-in content when isOpen is true', () => {
    render(<SignInSheet isOpen={true} onClose={() => {}} />)
    expect(screen.getByText('Welcome to Tangible')).toBeInTheDocument()
    expect(screen.getByText('Sign in to save your progress')).toBeInTheDocument()
    expect(screen.getByText('Continue with Apple')).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('calls signIn with apple when Apple button is clicked', () => {
    render(<SignInSheet isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByText('Continue with Apple'))
    expect(mockSignIn).toHaveBeenCalledWith('apple')
  })

  it('calls signIn with google when Google button is clicked', () => {
    render(<SignInSheet isOpen={true} onClose={() => {}} />)
    fireEvent.click(screen.getByText('Continue with Google'))
    expect(mockSignIn).toHaveBeenCalledWith('google')
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<SignInSheet isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('signin-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
bun run test -- SignInSheet
```

Expected: FAIL — `Cannot find module '@/components/SignInSheet'`

- [ ] **Step 3: Create SignInSheet component**

Create `src/components/SignInSheet.tsx`:

```tsx
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

interface SignInSheetProps {
  isOpen: boolean
  onClose: () => void
}

const SignInSheet = ({ isOpen, onClose }: SignInSheetProps) => {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null)

  if (!isOpen) return null

  const handleSignIn = async (provider: 'apple' | 'google') => {
    setLoading(provider)
    await signIn(provider)
    // OAuth redirect takes over — no need to close manually
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        data-testid="signin-backdrop"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-6 pt-8 pb-10 flex flex-col items-center gap-6 shadow-2xl">
        {/* Teal "T" logo */}
        <div className="w-16 h-16 rounded-2xl bg-[#43aa8b] flex items-center justify-center">
          <span className="text-white text-2xl font-semibold">T</span>
        </div>

        {/* Heading */}
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-semibold text-[#577590]">Welcome to Tangible</h2>
          <p className="text-sm text-[#333]">Sign in to save your progress</p>
        </div>

        {/* Auth buttons */}
        <div className="w-full space-y-2.5">
          <button
            onClick={() => handleSignIn('apple')}
            disabled={loading !== null}
            className="w-full py-3.5 rounded-xl bg-[#577590] text-white font-medium text-base flex items-center justify-center gap-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading === 'apple' ? (
              <span className="text-sm">Opening Apple Sign In...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </>
            )}
          </button>

          <button
            onClick={() => handleSignIn('google')}
            disabled={loading !== null}
            className="w-full py-3.5 rounded-xl bg-white border border-[#d9d9d9] text-[#577590] font-medium text-base flex items-center justify-center gap-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading === 'google' ? (
              <span className="text-sm">Opening Google Sign In...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        {/* Legal */}
        <p className="text-[11px] text-[#333]/50 text-center leading-relaxed">
          By continuing you agree to our{' '}
          <span className="underline cursor-pointer">Terms of Service</span>
          {' '}and{' '}
          <span className="underline cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </>
  )
}

export default SignInSheet
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
bun run test -- SignInSheet
```

Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
git add src/components/SignInSheet.tsx src/components/SignInSheet.test.tsx
git commit -m "feat: add SignInSheet bottom sheet component with Apple and Google auth"
```

---

## Task 2: Persist hasSignedInBefore on sign-in

**Files:**
- Modify: `src/context/AuthContext.tsx:30-34`

- [ ] **Step 1: Update `onAuthStateChange` to write the localStorage flag**

In `src/context/AuthContext.tsx`, replace lines 30–34:

```tsx
// BEFORE
const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session)
  setUser(session?.user ?? null)
  setIsLoading(false)
})
```

```tsx
// AFTER
const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  if (_event === 'SIGNED_IN') {
    localStorage.setItem('hasSignedInBefore', 'true')
  }
  setSession(session)
  setUser(session?.user ?? null)
  setIsLoading(false)
})
```

- [ ] **Step 2: Commit**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
git add src/context/AuthContext.tsx
git commit -m "feat: persist hasSignedInBefore flag to localStorage on sign-in"
```

---

## Task 3: Update routing for returning users

**Files:**
- Modify: `src/pages/Index.tsx:16-19`
- Create: `src/pages/Index.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/pages/Index.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '@/context/AuthContext'
const { default: Index } = await import('@/pages/Index')

describe('Index routing', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    localStorage.clear()
    // Mock video element (not available in jsdom)
    vi.spyOn(HTMLVideoElement.prototype, 'play').mockImplementation(() => Promise.resolve())
  })

  it('routes to /onboarding when unauthenticated and no prior sign-in', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      session: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<Index />)
    // Simulate splash complete via timeout
    await vi.runAllTimersAsync()
    expect(mockNavigate).toHaveBeenCalledWith('/onboarding', { replace: true })
  })

  it('routes to /home when unauthenticated but hasSignedInBefore is set', async () => {
    localStorage.setItem('hasSignedInBefore', 'true')
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      session: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<Index />)
    await vi.runAllTimersAsync()
    expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true })
  })

  it('routes to /home when authenticated', async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'abc' } as any,
      session: {} as any,
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    render(<Index />)
    await vi.runAllTimersAsync()
    expect(mockNavigate).toHaveBeenCalledWith('/home', { replace: true })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
bun run test -- Index
```

Expected: FAIL — routing tests fail (currently no `hasSignedInBefore` check in Index.tsx)

- [ ] **Step 3: Update routing logic in Index.tsx**

In `src/pages/Index.tsx`, replace lines 16–19:

```tsx
// BEFORE
useEffect(() => {
  if (!splashDone || isLoading) return;
  navigate(isAuthenticated ? '/home' : '/onboarding', { replace: true });
}, [splashDone, isAuthenticated, isLoading, navigate]);
```

```tsx
// AFTER
useEffect(() => {
  if (!splashDone || isLoading) return;
  const hasSignedInBefore = localStorage.getItem('hasSignedInBefore') === 'true';
  if (isAuthenticated || hasSignedInBefore) {
    navigate('/home', { replace: true });
  } else {
    navigate('/onboarding', { replace: true });
  }
}, [splashDone, isAuthenticated, isLoading, navigate]);
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
bun run test -- Index
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
git add src/pages/Index.tsx src/pages/Index.test.tsx
git commit -m "feat: route returning users to /home instead of /onboarding"
```

---

## Task 4: Add sign-back-in banner to HomePage

**Files:**
- Modify: `src/pages/HomePage.tsx:21-69`

- [ ] **Step 1: Add imports and the returning-user banner**

In `src/pages/HomePage.tsx`, the empty state block starts at line 21. Add the sign-in banner as the first thing rendered for unauthenticated returning users.

At the top of the file, add the SignInSheet import alongside existing imports:

```tsx
// Add to existing imports at top of src/pages/HomePage.tsx
import { useState } from 'react';
import SignInSheet from '@/components/SignInSheet';
```

Then, inside the `HomePage` component body, add this state variable right after the existing `const` declarations (after line 18 `const hour = ...`):

```tsx
const [showSignIn, setShowSignIn] = useState(false);
const isReturningUnauthenticated =
  !isAuthenticated &&
  localStorage.getItem('hasSignedInBefore') === 'true';
```

> Note: `isAuthenticated` is not currently destructured from `useAuth`. Update line 9 from:
> `const { user } = useAuth()` → `const { user, isAuthenticated } = useAuth()`

- [ ] **Step 2: Add the banner to the empty state block**

In the empty state `return` (lines 21–69), insert the sign-back-in banner immediately after the opening `<div className="min-h-screen bg-background pb-24">` tag (after line 23):

```tsx
{/* Sign-back-in banner for returning unauthenticated users */}
{isReturningUnauthenticated && (
  <div className="mx-4 mt-4 bg-[#43aa8b]/10 border border-[#43aa8b]/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
    <p className="text-sm text-[#43aa8b] font-medium leading-snug">
      Sign back in to access your books
    </p>
    <button
      onClick={() => setShowSignIn(true)}
      className="text-sm font-semibold text-white bg-[#43aa8b] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
    >
      Sign in
    </button>
  </div>
)}
```

Also add the `SignInSheet` and state at the bottom of the empty state `return`, before the final `</div>`:

```tsx
<SignInSheet isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
```

- [ ] **Step 3: Add the same banner and sheet to the main state return**

In the main state `return` (line 73 onwards), add the same banner immediately after the opening `<div className="min-h-screen bg-background pb-24">` tag, and the same `SignInSheet` before the final `</div>`:

```tsx
{/* Sign-back-in banner for returning unauthenticated users */}
{isReturningUnauthenticated && (
  <div className="mx-4 mt-4 bg-[#43aa8b]/10 border border-[#43aa8b]/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
    <p className="text-sm text-[#43aa8b] font-medium leading-snug">
      Sign back in to access your books
    </p>
    <button
      onClick={() => setShowSignIn(true)}
      className="text-sm font-semibold text-white bg-[#43aa8b] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
    >
      Sign in
    </button>
  </div>
)}
```

And before the final closing `</div>` of the main return:

```tsx
<SignInSheet isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
```

- [ ] **Step 4: Commit**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
git add src/pages/HomePage.tsx
git commit -m "feat: show sign-back-in banner on home page for returning unauthenticated users"
```

---

## Task 5: Add CTA button to PhotobookPreview

**Files:**
- Modify: `src/components/PhotobookPreview.tsx`

- [ ] **Step 1: Add imports**

At the top of `src/components/PhotobookPreview.tsx`, add these imports alongside the existing ones:

```tsx
import { useState } from 'react'; // already imported via useCallback — add useState if not present
import { useAuth } from '@/context/AuthContext';
import SignInSheet from '@/components/SignInSheet';
```

> Check line 1 — if `useState` is already imported with `useCallback`, just add to the destructure. Currently line 1 is: `import { useState, useCallback } from "react";` ✓ already there.

- [ ] **Step 2: Add state and auth check inside the main PhotobookPreview component**

The main export is `const PhotobookPreview`. Locate its opening `const` declarations (around line 487) and add:

```tsx
const { isAuthenticated } = useAuth();
const [showSignIn, setShowSignIn] = useState(false);
```

- [ ] **Step 3: Add the CTA button and SignInSheet at the bottom of the return**

In the `return` of `PhotobookPreview` (the final `<div className="flex flex-col gap-6 pb-8">`), add the following after `<EndSpread />` (line 602) and before the closing `</div>` (line 604):

```tsx
{/* Order / sign-in CTA */}
<div className="px-1 pt-2 pb-4">
  {isAuthenticated ? (
    <button className="w-full py-4 rounded-2xl bg-[#f8961e] text-white font-semibold text-base hover:opacity-90 transition-opacity">
      Order Now
    </button>
  ) : (
    <button
      onClick={() => setShowSignIn(true)}
      className="w-full py-4 rounded-2xl bg-[#577590] text-white font-semibold text-base hover:opacity-90 transition-opacity"
    >
      Sign in to save your progress
    </button>
  )}
</div>

<SignInSheet isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
```

- [ ] **Step 4: Run full test suite to check for regressions**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
bun run test
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
git add src/components/PhotobookPreview.tsx
git commit -m "feat: add auth-aware CTA button to PhotobookPreview — sign in or order now"
```

---

## Task 6: Delete unused SaveBookScreen

**Files:**
- Delete: `src/components/SaveBookScreen.tsx`

- [ ] **Step 1: Confirm SaveBookScreen is not imported anywhere**

```bash
grep -r "SaveBookScreen" /Users/vikramadityalakhotia/Documents/Claude/gettangible/src
```

Expected: only `src/components/SaveBookScreen.tsx` itself — no imports

- [ ] **Step 2: Delete the file**

```bash
rm /Users/vikramadityalakhotia/Documents/Claude/gettangible/src/components/SaveBookScreen.tsx
```

- [ ] **Step 3: Run full test suite to confirm nothing broke**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
bun run test
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/vikramadityalakhotia/Documents/Claude/gettangible
git add -A
git commit -m "chore: delete unused SaveBookScreen component (superseded by SignInSheet)"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Section 1 (SignInSheet bottom sheet) → Task 1
- ✅ Section 2 (Layout page CTA — auth-aware) → Task 5
- ✅ Section 3 (hasSignedInBefore flag) → Task 2
- ✅ Section 3 (Index routing for returning users) → Task 3
- ✅ Section 3 (Home page sign-back-in banner) → Task 4
- ✅ SaveBookScreen cleanup → Task 6

**Type consistency check:**
- `SignInSheet` props: `{ isOpen: boolean, onClose: () => void }` — used consistently in Tasks 1, 4, 5
- `signIn` function signature: `(provider: 'apple' | 'google') => Promise<void>` — from existing AuthContext, used as-is in Task 1
- `isAuthenticated` from `useAuth()` — added to destructure in Tasks 4 and 5
- `hasSignedInBefore` localStorage key: `'hasSignedInBefore'` — consistent across Tasks 2, 3, 4

**No placeholders:** All code blocks are complete and runnable.
