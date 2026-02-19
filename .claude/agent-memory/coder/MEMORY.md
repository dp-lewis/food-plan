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

## Store Sync Pattern (Phase 7 — Sync Intent Queue)

Actions push intents to `_syncQueue`; a subscriber dispatches them to the server.
`_userId` / `_isSyncing` / `_syncQueue` are in AppState but excluded from `partialize` — never hit localStorage.

**SyncIntent** is a discriminated union exported from `src/store/store.ts`.
**setupSyncSubscriber(store)** lives in `src/store/syncSubscriber.ts`. Called once in `StoreSync` on mount; returns unsubscribe. Drains queue on every store change; skips dispatch if `_userId` is null.
**_drainSync()** atomically clears and returns the queue.

Each store action = pure state change + `get()._pushSync({ type, ...data })`. No `if (_userId)` in actions.

`swapMeal` from `@/lib/planGenerator` is aliased `swapMealInPlan` in import to avoid collision with store method.

`StoreSync` uses `useRef<string | null>` to detect sign-in/sign-out transitions. Sign-in: server data wins; if server empty and local exists, upload local. Sign-out: clear store.

Key files: `src/store/store.ts`, `src/store/syncSubscriber.ts`, `src/components/StoreSync.tsx`.

## Realtime Shopping List (M7)

`checkedItems` is now `Record<string, string>` (itemId → checkedByEmail). Store version 2.
Realtime hook: `src/hooks/useRealtimeShoppingList.ts` — subscribes to INSERT/DELETE on `checked_items` and `custom_shopping_items`.
Type tip: Zustand `migrate` function parameter must be `unknown`, then cast inside: `const persisted = persistedState as Record<string, unknown>`.
Type tip: Supabase realtime payload `category` field must be cast to `IngredientCategory` (not `string`) to satisfy `CustomShoppingListItem`.
When updating `user?.email` in StoreSync inside a userId null-check block, TypeScript still considers `user` possibly null — use `user?.email ?? null` not `user.email ?? null`.

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

## Sign-out Flow (SignOutDialog component)

Sign-out is encapsulated in `src/components/SignOutDialog.tsx`.
Props: `userEmail: string | null | undefined`, `onSignedOut?: () => void`.
Renders a "Sign in" link when `userEmail` is falsy, or a trigger button + confirmation Drawer.
Usage in PageHeader: `actions={!authLoading && <SignOutDialog userEmail={user?.email} />}`
The Drawer component is imported directly from `@/components/ui/Drawer` (not via barrel).

## Shared Date Utilities

Date/day helpers live in `src/lib/dates.ts`:
- `DAYS` — array of day names (0=Monday...6=Sunday)
- `getTodayPlanIndex(startDay)` — plan-relative index for today
- `getDayName(startDay, dayIndex)` — day name for a plan slot
- `getOrderedDays(startDay)` — 7-element array of day names from startDay
- `getDateForDayIndex(startDay, dayIndex)` — formatted date string e.g. "Feb 15"
- `getUpNextSlot(todayIndex, meals, hour)` — returns the next meal slot to cook (or null)

## Component Architecture (Phase 6 refactor)

**Dashboard sub-components** live in `src/components/dashboard/`:
- `UpNextCard` — "up next" meal card (props: label, mealType, mealsWithRecipes)
- `TomorrowPreview` — tomorrow's meals preview (props: dayName, mealsWithRecipes)
- `ShoppingStatusCard` — shopping list progress (props: shoppingStatus {total, checked})
- `QuickActions` — primary + full plan action buttons (props: primaryAction, todayIndex)

`src/app/page.tsx` is the thin orchestrator: store access, auth, logic; passes data as props.

**Plan sub-components** live in `src/components/plan/`:
- `DaySlot` — one day's Card with all meal slots (props: dayName, dayIndex, isToday, startDay, slots, userRecipes, onAddMeal, onRemoveMeal)
- `MealCard` — single meal row within a slot (props: meal, recipe, onRemove)

`src/app/plan/current/page.tsx` orchestrates drawer state and passes callbacks down to `DaySlot`.

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

## iOS Safari WebSocket Suspension Fix

**Problem**: iOS Safari kills the Supabase realtime WebSocket when the app is backgrounded or phone locked. Events fired while hidden are lost.

**Solution**: Add a `visibilitychange` listener in the realtime hook that re-fetches the full state from Supabase when the page becomes visible after being hidden for more than `MIN_HIDDEN_MS` (3000ms). Use `Promise.all` to fetch both `checked_items` and `custom_shopping_items` concurrently, then bulk-set via store actions.

**Key details**:
- Use a `useRef<number | null>` to record when the page was hidden and compute elapsed time.
- Put the visibility listener in a **second `useEffect`** with dep array `[planId]` only — `userId` is not needed for re-fetching.
- The re-fetch must use the **browser Supabase client** (`src/lib/supabase/client.ts`), not `queries.ts` (which uses the server client).
- Add `_setCheckedItems(items: Record<string, string>)` and `_setCustomShoppingItems(items: CustomShoppingListItem[])` bulk-set actions to the store (these replace state entirely, like the other `_`-prefixed realtime helpers).

**Files changed**: `src/hooks/useRealtimeShoppingList.ts`, `src/store/store.ts`

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

## Unit Test Conventions (Phase 8)

Tests live in `src/lib/__tests__/<module>.test.ts`. Run with `npx vitest run --project unit`.

**Key patterns**:
- AAA (Arrange/Act/Assert) with inline comments
- `vi.useFakeTimers()` / `vi.setSystemTime()` in `beforeEach`/`afterEach` for date-dependent functions
- Place `beforeEach`/`afterEach` BEFORE the `it` blocks in the describe block
- For `swapMeal` random tests: built-in recipes always exist for standard meal types, so tests cannot assume a controlled pool — assert that current recipe is never returned instead of asserting a specific recipe is chosen
- `generateShoppingList` uses `getRecipeById(id, userRecipes)` — pass user recipes with non-colliding IDs to avoid interference with built-in data
- `getDateForDayIndex` uses `'en-US'` locale with `{ month: 'short', day: 'numeric' }` — produces "Jan 6" format

**Reference dates** (for fake timer tests):
- 2025-01-06 = Monday, 2025-01-07 = Tuesday, 2025-01-08 = Wednesday
- 2025-01-09 = Thursday, 2025-01-12 = Sunday

## Store + RLS Testing

See `testing.md` for full patterns. Key points:
- Store unit tests in `src/store/__tests__/`: use `useStore.setState({...})` to seed, no mocking needed for `_applyRemote*` actions
- RLS tests: nested `describe` with its own `beforeAll`/`afterAll`; clean up at start of `beforeAll` too; M8 uses IDs `eeeeeeeeee02`/`eeeeeeeeee03`, prefix `__rls_m8_`

## Realtime Hook Callback Stability

When a realtime hook accepts an `onRemoteChange?: () => void` callback, store it in a `useRef` to avoid the WebSocket subscription tearing down/rebuilding on every parent render (inline callbacks create a new reference each render):

```ts
const onRemoteChangeRef = useRef(onRemoteChange);
onRemoteChangeRef.current = onRemoteChange;
// Use onRemoteChangeRef.current?.() in event handlers
// dep array: [planId, userId] — NOT onRemoteChange
```

## Realtime Meal Plan (M8)

Realtime hook: `src/hooks/useRealtimeMealPlan.ts` — subscribes to INSERT/UPDATE/DELETE on `meals` and INSERT/DELETE on `custom_shopping_items`.
Store actions: `_applyRemoteMealInsert`, `_applyRemoteMealDelete`, `_applyRemoteMealUpdate`, `_applyRemoteCustomItemInsert`, `_applyRemoteCustomItemDelete` — these MUST NOT call `_pushSync` (incoming from server).
Access control: `addMealAction` uses `requirePlanAccess` (not `requirePlanOwner`) so members can add meals.
Share button stays owner-only: `planRole === 'owner' && user` guards `onShareClick`.
Type cast: DB `meal_type` is `string`, must cast to `MealType` with `as MealType`.
Migration: `supabase/migrations/00007_enable_realtime_meals.sql` — enables realtime on `meals` and `custom_shopping_items`.

## Playwright WebSocket Mock (Supabase Realtime)

See `realtime-mock.md` for full details. Critical points:
- Join reply MUST echo `filter` field exactly — omitting it causes silent channel error
- postgres_changes event data MUST include `columns: []` — missing causes `columns.find()` crash
- Checkbox component is `<button role="checkbox">` — use `aria-checked` attribute, NOT `input[type="checkbox"]`
- `DevTestSeam` component exposes `window.__setStoreState` for tests; mounted in layout
- Window casting: `(window as unknown as { __setStoreState: ... })`
