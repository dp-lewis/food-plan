# Testing Patterns

## Zustand Store Unit Tests (Node environment)

The store (`src/store/store.ts`) starts with `'use client'` but can be imported in Node vitest tests.
The `persist` middleware logs "Unable to update item ... storage is currently unavailable" — this is expected and harmless.

**Pattern for testing pure state actions**:
- Import `useStore` from `../store` (relative path within `src/store/__tests__/`)
- Seed state with `useStore.setState({ currentPlan: ..., customShoppingItems: ... })`
- Call actions via `useStore.getState().actionName(...)`
- Read state via `useStore.getState().stateProp`
- Reset between tests with `beforeEach(() => { useStore.setState({ ... }) })`

No mocking needed for `_applyRemote*` actions — they are pure state transforms.

Example test file: `src/store/__tests__/realtimeActions.test.ts`

## RLS Integration Test Pattern

File: `src/lib/supabase/__tests__/rls.integration.test.ts`

Key structure:
- Top-level `describe.skipIf(!canRun)` wraps everything
- Nested `describe` blocks per feature area
- Each nested describe has its own `beforeAll` (seed data + sign in) and `afterAll` (cleanup)
- Cleanup in `afterAll` uses `adminClient` (service role) to bypass RLS, in reverse dependency order
- Cleanup also happens at the START of `beforeAll` to handle leftover data from failed runs
- Use deterministic UUID IDs with unique prefixes per test group to ensure cleanup works
- Confirm successful inserts via `adminClient` to verify the row actually landed in DB

**M8 describe block IDs**:
- Owner: `'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee02'`
- Member: `'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeee03'`
- Data prefix: `'__rls_m8_'`

**plan_members cleanup**: Must `delete().like('meal_plan_id', ...)` — there is no `id` prefix on the row itself, so filter by `meal_plan_id`.
