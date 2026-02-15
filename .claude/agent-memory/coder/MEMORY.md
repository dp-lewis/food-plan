# Coder Agent Memory

## Zustand + Next.js Hydration Pattern

**Critical issue**: Zustand `persist` middleware with Next.js static pages causes a "double render" problem:
1. First render: store initializes with defaults (e.g. `currentPlan = null`)
2. After browser loads, Zustand reads localStorage and triggers a state update
3. Any `useEffect` that redirects based on null state fires in step 1 BEFORE step 2

**Solution used in this project**:
- `skipHydration: true` in persist config (store.ts)
- `StoreHydration` client component in layout calls `useStore.persist.rehydrate()` in `useEffect`
- Pages that redirect based on state use `useStore.persist.onFinishHydration()` + `hasHydrated` state to delay the redirect

**Key files**: `src/store/store.ts`, `src/components/StoreHydration.tsx`, `src/app/layout.tsx`

## Rules of Hooks

Never call `useMemo`/`useCallback`/`useState`/`useEffect` after a conditional `return`. React requires hooks to always be called in the same order. Move all hooks before any early returns.

## Playwright Test Stability

- When seeding localStorage via `page.evaluate()` then navigating, use `waitForSelector` to confirm the seeded state has hydrated and rendered before the test body runs.
- `createPlanWithMeals()` in `e2e/helpers/test-utils.ts` waits for `[data-testid^="meal-"]` to be visible after `page.goto('/plan/current')`.

## Test Fix: User Recipe on Shopping List

**Problem**: Tests that create a user recipe then generate a plan fail because `createEmptyPlan()` creates a plan with NO meals. The plan generator only creates an empty plan.

**Fix**: After creating the user recipe and an empty plan, inject the recipe into the plan via `page.evaluate()` + `localStorage`, then navigate to `/shopping-list` directly. See `us-7.1` and `us-7.2` shopping list tests for the pattern.

## Store Sync Pattern (Milestone 4)

Write-through: local `set()` first, then `if (get()._userId) { serverAction().catch(console.error) }`.

`_userId` / `_isSyncing` are in AppState but excluded from `partialize` — never hit localStorage.

`swapMeal` from `@/lib/planGenerator` is aliased `swapMealInPlan` in import to avoid collision with store method.

`StoreSync` uses `useRef<string | null>` to detect sign-in/sign-out transitions. Sign-in: server data wins; if server empty and local exists, upload local. Sign-out: clear store.

Key files: `src/store/store.ts`, `src/components/StoreSync.tsx`.

## useMemo for Stability

When a component has state that changes frequently (e.g. `drawerState`) and expensive child renders, memoize the data computation with `useMemo`. This prevents re-computation but React still re-renders the JSX tree — actual DOM stability comes from stable keys and the hydration fix above.

## useSearchParams Suspense Boundary

`useSearchParams()` in Next.js App Router requires a Suspense boundary or the build fails with a prerender error. Pattern: put the component using `useSearchParams` in a child component, then wrap it in `<Suspense>` in the parent page component. See `src/app/auth/signin/page.tsx`.

## Next.js 16 Middleware Deprecation

Next.js 16 renamed `middleware.ts` to `proxy.ts` but `middleware.ts` still works with a deprecation warning. Non-breaking.

## Auth Pattern (Milestone 2)

Key files for Supabase magic link auth (OPTIONAL — no routes protected):
- `src/middleware.ts` — refreshes Supabase session on every request (cookie shuttle pattern)
- `src/components/AuthProvider.tsx` — React context with `useAuth()` hook: `{ user, loading }`
- `src/app/auth/callback/route.ts` — exchanges magic link code for session
- `src/app/auth/signout/route.ts` — POST handler, redirects to origin with 303
- `src/app/auth/signin/page.tsx` — OTP code entry form (6-digit) + magic link fallback, Suspense wrapping

BottomNav back button testid is `bottom-nav-back` (not `back-link`).

## BottomNav Actions

Props: `primaryAction`, `secondaryAction`, `tertiaryAction` — each is `{ label, href?, onClick?, testId? }`.
No `actions` array prop exists. Test IDs use `testId` field (not `data-testid`).

## Environment: No node_modules

The sandbox has no network. `npm run build` / `tsc --noEmit` produce "Cannot find module" errors for ALL files.
These are pre-existing. Filter tsc output for your specific file to confirm no NEW errors were introduced.

## Sign-out Flow (Confirmation Drawer)

Programmatic sign-out: `fetch('/auth/signout', { method: 'POST' })` then `router.push('/'); router.refresh()`.
The `Drawer` component is imported directly from `@/components/ui/Drawer` (not via barrel).
Both render branches (active plan + empty state) share the same `signOutDrawerOpen`/`signOutLoading` state declared at top of the `Dashboard` component — each branch renders its own `<Drawer>` instance with the shared state.

## FAB (Floating Action Button) Implementation

**Pattern** (as of refactor for iPhone usability):
- FAB sizing: 56px (w-14 h-14) meets 44px minimum touch target
- FAB positioning: `absolute left-1/2 -translate-x-1/2 bottom-[calc(100%-28px)]` overlaps nav bar by 28px
- Z-index layering: Nav `z-20`, FAB `z-30`
- Elevation: `shadow-lg` base, `hover:shadow-xl` on hover
- Accessibility: Always include `aria-label` for icon-only FAB
- Container: Use `relative` parent for FAB positioning

**Design tokens**: `bg-primary text-primary-foreground hover:bg-primary/90`
**Mobile-first**: FAB solves cramped navigation on small screens and iPhone corner cutoffs

## Browser Compatibility: UUID Generation

**Problem**: `crypto.randomUUID()` is not supported in older mobile browsers (especially older iOS Safari versions).

**Solution**: Created `src/lib/uuid.ts` with `generateUUID()` function that:
- First attempts to use native `crypto.randomUUID()` when available
- Falls back to `crypto.getRandomValues()` with proper UUID v4 format
- Pattern: `'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'` where:
  - `4` is the version number (UUID v4)
  - `y` is one of 8, 9, a, or b (variant bits)

**Usage**: Always import and use `generateUUID()` from `@/lib/uuid` instead of `crypto.randomUUID()` directly.

**Files using generateUUID()**:
- `src/lib/planGenerator.ts` - Meal plan ID generation
- `src/store/store.ts` - Custom shopping list item IDs
- `src/app/actions/share.ts` - Share code generation

## Sticky Positioning with Fixed Headers

**Pattern**: When making section headings sticky below a fixed/sticky header:
- Calculate the `top` offset based on the fixed header height
- PageHeader uses `py-4` padding ≈ 56-60px total height, so use `top-[56px]` for sticky elements below it
- Z-index layering: PageHeader `z-40`, sticky sections `z-30`, content `z-10`
- Add visual separation: `border-b border-border` or shadow to indicate floating state
- Match container borders: Use `rounded-t-lg` if parent has rounded corners
- Stack properly: Each sticky heading replaces the previous one as you scroll

**Example** (Plan page day headings):
```tsx
<div className="sticky top-[56px] z-30 px-4 py-2 bg-muted ... rounded-t-lg border-b border-border">
```
