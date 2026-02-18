# A11y Auditor Memory

## Project Overview
Food Plan / "Did We Get" - mobile-first PWA (Next.js 15, Tailwind CSS, Zustand).
Design tokens live in `src/styles/tokens.css`. UI components in `src/components/ui/`.

## Audit History

### Full Audit — February 2026
Comprehensive audit completed across all pages and components. See `audit-2026-02.md` for full report.

**Key findings summary:**
- CRITICAL: Primary green (#16a34a) on white fails WCAG AA normal-text contrast (3.30:1, need 4.5:1)
- CRITICAL: White text on primary green header also fails (same 3.30:1 pair, all header text/icons affected)
- CRITICAL: primary-foreground/70 on primary bg is ~2.34:1 (user email and sign-in link in header)
- MAJOR: Warning alert (#d97706 on #fef3c7) = 2.86:1 — fails both thresholds
- MAJOR: Success alert (#16a34a on #dcfce7) = 3.00:1 — fails normal text threshold
- MAJOR: Error alert (#dc2626 on #fee2e2) = 3.95:1 — fails normal text (4.5:1 required)
- MAJOR: Info alert (#2563eb on #dbeafe) = 4.24:1 — fails normal text threshold
- MAJOR: Muted foreground on muted bg (#6b7280 / #f3f4f6) = 4.39:1 — fails AA
- MAJOR: Drawer has hardcoded `id="drawer-title"` — only one drawer can exist at a time safely (already true, but fragile)
- MAJOR: Button `loading` state has no aria-live announcement — screen readers miss state changes
- MAJOR: BottomNav tabs have no `aria-current="page"`
- MAJOR: `confirm()` native dialog used for recipe delete — not accessible in all AT contexts
- MAJOR: Shopping list "Clear checked" button has no minimum touch target (text-only button in header)
- MAJOR: BackLink uses ← character instead of a proper icon with aria-hidden
- MAJOR: Link wrapping Button components — nested interactive elements pattern (a > button)
- MINOR: Stepper label `<label>` is not associated with an input (presentational only)
- MINOR: MetaChip uses aria-label on a div with duplicate visible text inside
- MINOR: Recipe ingredient bullet (decorative checkbox span) missing aria-hidden on `/recipe/[id]/page.tsx`
- MINOR: Ingredients group label in new/add recipe pages has no htmlFor (not an input label)
- MINOR: `main` element missing `id="main-content"` on several pages

## Key Color Contrast Values (tokens.css)
- #16a34a (primary) / #ffffff = 3.30:1 — FAILS AA normal text
- #111827 (foreground) / #ffffff = 17.74:1 — passes
- #6b7280 (muted-foreground) / #ffffff = 4.83:1 — passes AA
- #6b7280 / #f3f4f6 (muted) = 4.39:1 — FAILS AA normal text
- #6b7280 / #f9fafb (secondary) = 4.63:1 — passes AA
- #dc2626 (destructive) / #ffffff = 4.83:1 — passes
- #dc2626 / #fee2e2 (error-light) = 3.95:1 — FAILS AA normal text
- #16a34a / #dcfce7 (success-light) = 3.00:1 — FAILS AA
- #d97706 (warning) / #fef3c7 (warning-light) = 2.86:1 — FAILS
- #2563eb (info) / #dbeafe (info-light) = 4.24:1 — FAILS AA normal text

## Patterns Confirmed Working Well
- Drawer: proper role=dialog, aria-modal=true, aria-labelledby, Escape key, focus trap, focus-on-open
- Input component: useId, htmlFor association, aria-invalid, aria-describedby for errors, role=alert on error
- Checkbox: proper role=checkbox, aria-checked, aria-label
- ToggleGroup: role=group with aria-labelledby, aria-pressed on buttons
- Stepper: aria-live polite on value display, aria-label on +/- buttons
- ProgressBar: role=progressbar with valuenow/min/max/label
- Skip link present in root layout (skip-link class)
- html lang="en" set
- Focus styles defined in globals.css for keyboard navigation
- touch targets generally 44px (h-11 = 44px used on buttons)
- EmptyState icon: aria-hidden + role=presentation

## Pages Without main#main-content
- `/plan/current/page.tsx` (loading skeleton has no id, main page has id="main-content" - OK)
- `/recipe/[id]/page.tsx` — missing id="main-content" on main
- `/recipes/[id]/page.tsx` — missing id="main-content" on main
- `/recipes/new/page.tsx` — missing id="main-content" on main
- `/recipes/add/page.tsx` — missing id="main-content" on main
- `/shared/[code]/page.tsx` error state — missing id on main, no PageHeader
