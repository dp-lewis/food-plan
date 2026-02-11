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
