

## Tangible Photobook App — Implementation Plan

### Design System (Applied Globally)

Colors from "Sunflower Groove" palette:
- **Primary Accent 1** `#f9c74f` — warm highlights, secondary buttons
- **Primary Accent 2** `#f8961e` — CTAs, progress bars, active tabs
- **Secondary Accent** `#90be6d` — non-critical highlights, positive feedback
- **Teal Highlight** `#43aa8b` — feature callouts, toggles, selection markers
- **Slate Base** `#577590` — text, headers, primary buttons, borders
- **Background** `#FFFFFF`

Typography: SF Pro Display / system font, Slate Base color for headers/body.

### What Gets Built

**1. Update Tailwind + CSS variables** to use the Tangible palette as the project's theme.

**2. Save design system to project memory** so it persists across sessions.

**3. Index page — mobile toggle view** with pill-shaped toggle ("Shortlisted photos" / "Preview") using Slate Base for active tab, white background.

**4. Shortlisted Photos view:**
- Photo grid grouped by date headers (e.g., "5 April 2026")
- Filter controls matching the uploaded reference (image-2): toggle switches for "Remove screenshots", "Remove blurry photos", "Remove near-duplicates", "Include selfies" — each with teal-colored toggle switches and detection counts
- Summary banner at bottom: "X photos shortlisted for your book"
- "Add photos" button (Primary Accent 2 CTA)
- Demo/placeholder photo data

**5. Preview view — Layflat photobook:**
- A4 landscape page spreads (two pages visible as a flat spread, no gutter shadow — mimicking layflat binding)
- Photos auto-arranged across spreads
- Page navigation (left/right arrows or swipe)
- Page counter ("Pages 2-3 of 24")
- Realistic book styling: subtle shadow, white page with slight margin

**6. Components created:**
- `PhotoToggle` — the pill toggle
- `ShortlistedPhotos` — grid + filters + add button
- `PhotoFilters` — the toggle-switch filter panel from the reference
- `PhotobookPreview` — layflat spread viewer

### Technical Details
- All state managed locally with React useState (demo data)
- Placeholder images via gradient squares or picsum.photos
- Mobile-first layout (max-width ~430px centered)
- Tailwind config updated with custom colors: `tangible-gold`, `tangible-orange`, `tangible-green`, `tangible-teal`, `tangible-slate`

