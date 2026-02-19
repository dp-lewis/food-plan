# Playwright WebSocket Mock for Supabase Realtime

## Key files
- `e2e/helpers/realtimeMock.ts` — reusable mock helper
- `src/components/DevTestSeam.tsx` — exposes `window.__setStoreState` for tests
- `e2e/realtime-ws.spec.ts` — the 5 integration tests

## Critical Implementation Notes

### 1. Join reply must echo filter field exactly
The Supabase JS client (`RealtimeChannel`) validates the join response field-by-field:
`event`, `schema`, `table`, and crucially **`filter`**. If the server reply omits `filter`
but the client sent one (e.g. `meal_plan_id=eq.xxx`), `isFilterValueEqual(undefined, 'meal_plan_id=eq.xxx')`
returns `false` → channel errors and unsubscribes silently.

Fix: parse `sub.filter` from the client's join payload and echo it back in the reply.

### 2. postgres_changes events need `columns: []` in data
`_getPayloadRecords` calls `convertChangeData(payload.columns, payload.record)`, and
`convertColumn` calls `columns.find(...)` — if `columns` is `undefined`, this throws
`Cannot read properties of undefined (reading 'find')` and the event is swallowed silently.

Fix: always include `columns: []` in the `data` field of injected events.
An empty array means all values pass through untyped (fine for test data already in JS types).

### 3. Checkbox component is a <button role="checkbox">, not <input type="checkbox">
Use `[data-testid="checkbox-${itemId}"]` with `.toHaveAttribute('aria-checked', 'true/false')`.
Do NOT use `input[type="checkbox"]` — it won't find anything.

### 4. waitForChannelsReady resolves on 3 phx_join messages, not replies
The promise resolves once 3 topics have sent `phx_join` to the mock server.
The Supabase client only establishes subscriptions AFTER it receives the join reply.
Since we reply synchronously in `ws.onMessage`, by the time `waitForChannelsReady()`
resolves, the replies have been sent and the client is processing them concurrently.
Works correctly — just be aware the promise counts joins not completions.

### 5. DevTestSeam type cast
`useStore.setState(partial as unknown as Parameters<typeof useStore.setState>[0])` — need
`unknown` as intermediate cast to avoid TS error about insufficient overlap.

## Test pattern for `__setStoreState`
```ts
await page.waitForFunction(() => typeof (window as unknown as Record<string, unknown>).__setStoreState === 'function');
await page.evaluate((userId) => {
  (window as unknown as { __setStoreState: (s: Record<string, unknown>) => void }).__setStoreState({ _userId: userId });
}, TEST_USER_ID);
```

## Channel subscription map (3 channels, always)
- `realtime:meal-plan-${planId}` — 6 postgres_changes (meal_plans DELETE, meals INSERT/UPDATE/DELETE, custom_shopping_items INSERT/DELETE)
- `realtime:shopping-${planId}` — 5 postgres_changes (checked_items INSERT/UPDATE/DELETE, custom_shopping_items INSERT/DELETE)
- `realtime:shopping-bc-${planId}` — 0 postgres_changes (broadcast only)
