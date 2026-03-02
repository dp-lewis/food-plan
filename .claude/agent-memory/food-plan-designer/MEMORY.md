# Food Plan Designer Memory

## Design System Overview
- Tokens: `src/styles/tokens.css` — warm earthy palette, green primary (#4c7561), cream background (warm-50 #faf3ee)
- Tailwind @theme inline mapping in `src/app/globals.css`
- Two fonts: Castoro (display/serif, `font-display`) for headings, Inter (sans) for body
- Dark mode via `@media (prefers-color-scheme: dark)` only — no manual toggle
- --space-11 (2.75rem = 44px) is the canonical touch-target spacing token

## Established Page Layout Pattern
All main pages use: `<div class="min-h-screen bg-primary">` + `<PageHeader>` + `<main class="bg-background rounded-t-3xl ...">` + `<BottomNav>`
- Exceptions: /plan/new, /recipes/add, /recipes/new use `bg-background` for the outer div (no rounded panel treatment)
- Main content max-width is `max-w-2xl` for list/dashboard pages, `max-w-md` for form/detail pages
- Bottom padding on main: `pb-40` on pages with BottomNav, `pb-6` on pages without
- Pages WITHOUT BottomNav: /plan (create), /recipe/[id], /recipes/new, /recipes/add, /recipes/[id]

## Component Inconsistencies Found (updated 2026-03-02 full audit)

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

### Input component inconsistency
- Input component uses `bg-background` not `bg-input-background` — `--input-background` token exists but is unused in the component

### ProgressBar inline style mixing
- ProgressBar uses `border` class (which maps to --border via globals.css *{@apply border-border}) plus inline style for borderColor — mixing patterns

### DaySlot hardcoded sticky offset
- `top-[76px]` in DaySlot sticky header is brittle against PageHeader height changes

### Alert element choice
- Alert uses `<p role="alert">` — should be `<div>` for multi-line or compound content

### Duplicate URL fetch logic
- Import URL fetching logic duplicated in both `src/app/recipes/page.tsx` (Drawer) and `src/app/recipes/add/page.tsx`

### Error displayed twice on recipe import
- In recipes/add URL step: error appears in both `Input error={}` prop AND a separate `<Alert>` — double rendering

### Confirmation button ordering inconsistent
- Leave Plan drawer: Cancel | Confirm
- Delete Plan drawer: Cancel | Delete (correct danger placement)
- Delete Recipe drawer (recipes/[id]): Cancel on top, Delete on bottom (vertical stack, reversed from others)

### Share drawer re-triggers API call
- In plan/current, the "Generate link" button inside the share drawer calls `handleOpenShareDrawer()` which resets state and triggers another API call — should call a separate generate-only handler

## Token System Is Generally Solid
No hardcoded hex colors in component/page TSX files. All color references go through tokens. Border token `--border` maps to warm-200 — good.

## Navigation Pattern Notes
- BottomNav FAB: route-aware, only shows when callback prop is provided by page
- Drawer is used correctly for confirmations and quick inputs throughout
- BackLink component has no min-height — largely superseded by PageHeader back button
- Toast fixed at bottom-24 — may overlap BottomNav in edge cases
- OfflineBanner (fixed top-0) can overlap PageHeader's sticky top-0 — no offset applied

## Key UX Insights for Food Plan Context
- Dashboard "Today" card uses text-4xl for recipe title — strong visual hierarchy, good for at-a-glance use
- ShoppingStatusCard progress commentary (e.g. "Nearly there now") is a nice motivational touch
- SectionHeading floating label (-translate-y-1/2 above card border) is a distinctive UI motif — requires parent `pt-8`; coupling must be maintained
- RecipeDrawer separates "My Recipes" and "More Recipes" with section headers — good information architecture
