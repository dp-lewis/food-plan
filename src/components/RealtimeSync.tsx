'use client';

import { useStore } from '@/store/store';
import { useRealtimeMealPlan } from '@/hooks/useRealtimeMealPlan';
import { useRealtimeShoppingList } from '@/hooks/useRealtimeShoppingList';

/**
 * Mounts once in the root layout and keeps Supabase Realtime subscriptions
 * alive for the entire session — regardless of which page the user is on.
 *
 * Putting subscriptions here rather than in individual pages prevents the
 * subscribe/unsubscribe gap that occurs when navigating between pages.
 */
export function RealtimeSync() {
  const planId = useStore((state) => state.currentPlan?.id ?? null);
  const userId = useStore((state) => state._userId);

  useRealtimeMealPlan(planId, userId);
  useRealtimeShoppingList(planId, userId);

  return null;
}
