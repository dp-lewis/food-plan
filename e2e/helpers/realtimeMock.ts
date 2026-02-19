import type { Page } from '@playwright/test';

/**
 * Sets up a Playwright WebSocket mock for Supabase Realtime.
 *
 * Intercepts the WebSocket at wss://.../realtime/v1/... and handles the
 * Phoenix Channels protocol:
 *   - phx_join  → replies with ok + assigns subscription IDs
 *   - heartbeat → replies with ok
 *   - phx_leave → replies with ok
 *
 * Returns helpers to inject fake postgres_changes and broadcast events,
 * and a `waitForChannelsReady()` promise that resolves once all three
 * expected channels (meal-plan, shopping, shopping-bc) have joined.
 */

export interface RealtimeMock {
  /** Wait until all three Supabase channels have completed their join handshake. */
  waitForChannelsReady(): Promise<void>;
  /** Inject a postgres_changes INSERT into the meals table. */
  injectMealInsert(planId: string, row: {
    id: string; meal_plan_id: string; day_index: number;
    meal_type: string; recipe_id: string; servings: number; user_id: string;
  }): void;
  /** Inject a postgres_changes DELETE from the meals table. */
  injectMealDelete(planId: string, oldRow: { id: string; meal_plan_id: string }): void;
  /** Inject a postgres_changes INSERT into checked_items. */
  injectCheckedItemInsert(planId: string, row: {
    item_id: string; meal_plan_id: string; checked_by: string; checked_by_email: string;
  }): void;
  /** Inject a broadcast event (e.g. item_unchecked, clear_checked). */
  injectBroadcast(planId: string, event: string, payload: Record<string, unknown>): void;
  /** Inject a postgres_changes DELETE from meal_plans (owner deleted the plan). */
  injectPlanDelete(planId: string): void;
}

export async function setupRealtimeMock(page: Page): Promise<RealtimeMock> {
  // ws reference captured in route handler closure so we can send later
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wsSend: ((msg: string) => void) | null = null;

  // Track subscription id assignments: topic → { event, table } → id
  const subIdMap = new Map<string, { event: string; table: string; id: number }[]>();
  let nextId = 1;

  // Track joined channels to know when all three are ready
  const joinedChannels = new Set<string>();
  let resolveReady: (() => void) | null = null;
  const readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  await page.routeWebSocket('**/realtime/v1/**', (ws) => {
    wsSend = (msg: string) => ws.send(msg);

    ws.onMessage((raw) => {
      const msg = JSON.parse(raw as string) as [string | null, string | null, string, string, Record<string, unknown>];
      const [joinRef, ref, topic, event, payload] = msg;

      if (event === 'phx_join') {
        // Assign IDs to postgres_changes subscriptions.
        // The client sends { event, schema, table, filter? } for each subscription.
        // The server response must echo back the same event/schema/table/filter values
        // plus an assigned id — the Supabase JS client validates this field-by-field
        // (RealtimeChannel.isFilterValueEqual) and errors if they don't match.
        const pgChanges = (payload?.config as {
          postgres_changes?: { event: string; schema?: string; table: string; filter?: string }[]
        })?.postgres_changes ?? [];
        const subs = pgChanges.map((sub) => ({
          id: nextId++,
          event: sub.event,
          schema: sub.schema ?? 'public',
          table: sub.table,
          filter: sub.filter,
        }));
        subIdMap.set(topic, subs);

        // Reply with ok and assigned IDs — must echo event/schema/table/filter exactly.
        ws.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', {
          status: 'ok',
          response: {
            postgres_changes: subs.map((s) => ({
              id: s.id,
              event: s.event,
              schema: s.schema,
              table: s.table,
              ...(s.filter !== undefined ? { filter: s.filter } : {}),
            })),
          },
        }]));

        // Track joined channels — we expect 3 total
        joinedChannels.add(topic);
        if (joinedChannels.size >= 3 && resolveReady) {
          resolveReady();
          resolveReady = null;
        }
      } else if (event === 'heartbeat') {
        ws.send(JSON.stringify([null, ref, 'phoenix', 'phx_reply', { status: 'ok', response: {} }]));
      } else if (event === 'phx_leave') {
        ws.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]));
      }
      // broadcast send from client, access_token refresh → no reply needed
    });
  });

  function getSubId(topic: string, tableEvent: string, table: string): number | null {
    const subs = subIdMap.get(topic) ?? [];
    return subs.find((s) => s.event === tableEvent && s.table === table)?.id ?? null;
  }

  function send(msg: unknown) {
    if (!wsSend) throw new Error('WebSocket not yet connected');
    wsSend(JSON.stringify(msg));
  }

  return {
    waitForChannelsReady() {
      return readyPromise;
    },

    injectMealInsert(planId, row) {
      const topic = `realtime:meal-plan-${planId}`;
      const id = getSubId(topic, 'INSERT', 'meals');
      if (id === null) throw new Error(`No subscription ID found for meals INSERT on ${topic}`);
      send([null, null, topic, 'postgres_changes', {
        ids: [id],
        data: {
          schema: 'public', table: 'meals', type: 'INSERT',
          commit_timestamp: new Date().toISOString(),
          columns: [],
          record: row, old_record: {}, errors: null,
        },
      }]);
    },

    injectMealDelete(planId, oldRow) {
      const topic = `realtime:meal-plan-${planId}`;
      const id = getSubId(topic, 'DELETE', 'meals');
      if (id === null) throw new Error(`No subscription ID found for meals DELETE on ${topic}`);
      send([null, null, topic, 'postgres_changes', {
        ids: [id],
        data: {
          schema: 'public', table: 'meals', type: 'DELETE',
          commit_timestamp: new Date().toISOString(),
          columns: [],
          record: {}, old_record: oldRow, errors: null,
        },
      }]);
    },

    injectCheckedItemInsert(planId, row) {
      const topic = `realtime:shopping-${planId}`;
      const id = getSubId(topic, 'INSERT', 'checked_items');
      if (id === null) throw new Error(`No subscription ID found for checked_items INSERT on ${topic}`);
      send([null, null, topic, 'postgres_changes', {
        ids: [id],
        data: {
          schema: 'public', table: 'checked_items', type: 'INSERT',
          commit_timestamp: new Date().toISOString(),
          columns: [],
          record: row, old_record: {}, errors: null,
        },
      }]);
    },

    injectBroadcast(planId, event, payload) {
      const topic = `realtime:shopping-bc-${planId}`;
      send([null, null, topic, 'broadcast', {
        event,
        payload,
        type: 'broadcast',
      }]);
    },

    injectPlanDelete(planId) {
      const topic = `realtime:meal-plan-${planId}`;
      const id = getSubId(topic, 'DELETE', 'meal_plans');
      if (id === null) throw new Error(`No subscription ID found for meal_plans DELETE on ${topic}`);
      send([null, null, topic, 'postgres_changes', {
        ids: [id],
        data: {
          schema: 'public', table: 'meal_plans', type: 'DELETE',
          commit_timestamp: new Date().toISOString(),
          columns: [],
          record: {}, old_record: { id: planId }, errors: null,
        },
      }]);
    },
  };
}
