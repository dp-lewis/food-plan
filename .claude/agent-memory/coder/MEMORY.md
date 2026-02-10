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

## useMemo for Stability

When a component has state that changes frequently (e.g. `drawerState`) and expensive child renders, memoize the data computation with `useMemo`. This prevents re-computation but React still re-renders the JSX tree — actual DOM stability comes from stable keys and the hydration fix above.
