# Food Plan Designer Memory

## Design System Overview
- Tokens: `src/styles/tokens.css` — warm earthy palette, green primary (#5b806e), cream background (#f4ece6)
- Tailwind @theme inline mapping in `src/app/globals.css`
- Two fonts: Castoro (display/serif, `font-display`) for headings, Inter (sans) for body
- Dark mode via `@media (prefers-color-scheme: dark)` only — no manual toggle

## Established Page Layout Pattern
All main pages use: `<div class="min-h-screen bg-primary">` + `<PageHeader>` + `<main class="bg-background rounded-t-3xl ...">` + `<BottomNav>`
- Exceptions: /plan/new, /recipes/add, /recipes/new, /auth/signin use `bg-background` for the outer div (no rounded panel treatment)
- Main content max-width is `max-w-2xl` for list/dashboard pages, `max-w-md` for form/detail pages
- Bottom padding on main: `pb-40` on pages with BottomNav, `pb-6` on pages without

## Component Inconsistencies Found (updated 2026-03-01 full audit)

### Radius inconsistency
- Button: `rounded-2xl`; Card: `rounded-2xl`; Input/Select: `rounded-sm`; Stepper/ToggleGroup: `rounded-sm`
- Raw inputs in pages use `rounded-sm` OR `rounded-lg` (inconsistent)
- Dashboard CTA buttons override with `rounded-[16px]` arbitrary value

### Touch targets
- Delete button in shopping-list: `p-2` only (~32px) — below 44px minimum
- Remove ingredient button in recipes/new: `p-1 rounded text-sm` — well below 44px
- PageHeader back button: `p-1 -ml-1` gives ~28px target — below 44px
- SignOutDialog trigger: `text-xs` button with no size constraint — not 44px
- BackLink component: no minimum height set, ~20px touch target

### Raw `<input>` anti-pattern
Instead of using the `Input` component from ui/, raw `<input>` elements appear in:
- `src/app/shopping-list/page.tsx` (add item drawer)
- `src/app/recipes/page.tsx` (import URL drawer)
- `src/app/plan/current/page.tsx` (share link read-only input)

### Arbitrary values bypassing token system
- `rounded-[16px]` in UpNextCard.tsx and ShoppingStatusCard.tsx (should use `rounded-2xl`)
- `text-[2rem]` in UpNextCard.tsx and EmptyState.tsx (should reference token)
- `text-[10px]` in PlanMembersRow.tsx (below readable sizes)

### border-warning missing from tokens
- `OfflineBanner.tsx` uses `border-warning` but `--warning` border color not mapped in `@theme inline` in globals.css

### Page layout inconsistencies
- Recipe detail pages (`/recipe/[id]`, `/recipes/[id]`) use `max-w-md` but have no BottomNav and use `pb-6` (correct)
- `/plan/current` skeleton loading state is missing `id="main-content"` and BottomNav has no Share prop
- Empty state in shopping-list missing `id="main-content"` on its `<main>`

### Typography
- h1 in globals.css base: `font-size: var(--text-2xl)` — but `--text-2xl` is defined in tokens
- Auth signin page renders `<h1>` with `text-2xl font-semibold` (bypasses base layer display font treatment)
- SectionHeading in UpNextCard/ShoppingStatusCard is a duplicated private component

## Token System Is Generally Solid
No hardcoded hex colors in component/page TSX files. All color references go through tokens. Border token `--border` maps to `#ebcfbc` (warm sand) — good.

## Navigation Pattern Notes
- BottomNav FAB: route-aware, only shows when callback prop is provided by page
- Drawer is used correctly for confirmations and quick inputs throughout
- BackLink component appears to be largely unused — PageHeader handles back navigation in most places
- `onTodayClick` prop on BottomNav is wired in stories but never consumed inside the component — dead prop

## Confirmed Destructive-Action Pattern Issue
- Delete confirm in `/recipes/[id]/page.tsx` line 161 uses `variant="secondary"` with className overrides — confirm delete should use a true destructive variant or at minimum the `bg-destructive` token directly, not secondary + override
- Delete Plan confirm in plan/current uses `className="flex-1 bg-destructive text-destructive-foreground"` override on a primary button — inconsistent approach across the two deletion flows

## Button Size Violation (P0)
- `Button` `size="small"` renders at `h-9` (36px) — below 44px WCAG minimum
- Used in: DaySlot.tsx lines 74 and 103, MealCard.tsx line 34, plan/current/page.tsx lines 385, 400, 470
- All "Add meal", "Remove meal", "Leave Plan", "Delete Plan" buttons are too small

## ProgressBar Inline Style
- `ProgressBar` accepts `colorVar` as a string passed to `style={{ backgroundColor: colorVar }}`
- The shopping-list PageHeader passes `"var(--primary-foreground)"` as colorVar — valid token ref
- ShoppingStatusCard passes `"var(--progress-shopping)"` — valid token ref
- Pattern is intentional but bypasses Tailwind — acceptable if documented

## Import Recipe Duplication
- `/recipes/add/page.tsx` contains a full URL-input step that duplicates the import drawer in `/recipes/page.tsx`
- The flow from the drawer navigates to /recipes/add with the parsed recipe in store — this is the intended path
- The step='url' branch of /recipes/add is a fallback/legacy path — consider removing or clearly marking it
