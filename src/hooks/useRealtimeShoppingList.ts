'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/store';
import type { CustomShoppingListItem, IngredientCategory } from '@/types';

// Minimum time the page must be hidden before we re-fetch on return (ms).
// This avoids unnecessary round-trips for brief tab switches.
const MIN_HIDDEN_MS = 3_000;

export function useRealtimeShoppingList(planId: string | null, userId: string | null) {
  // Track when the page was hidden so we can decide whether to re-fetch.
  const hiddenAtRef = useRef<number | null>(null);

  // WebSocket realtime subscription
  useEffect(() => {
    if (!planId || !userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`shopping-${planId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'checked_items',
          filter: `meal_plan_id=eq.${planId}`,
        },
        (payload) => {
          const row = payload.new as { item_id: string; checked_by: string; checked_by_email: string | null };
          if (row.checked_by === userId) return; // skip self
          useStore.getState()._mergeCheckedItem(row.item_id, row.checked_by_email ?? '');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'checked_items',
          filter: `meal_plan_id=eq.${planId}`,
        },
        (payload) => {
          const row = payload.new as { item_id: string; checked_by: string; checked_by_email: string | null };
          if (row.checked_by === userId) return; // skip self
          useStore.getState()._mergeCheckedItem(row.item_id, row.checked_by_email ?? '');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'checked_items',
          filter: `meal_plan_id=eq.${planId}`,
        },
        (payload) => {
          const row = payload.old as { item_id: string; checked_by?: string };
          if (row.checked_by === userId) return; // skip self
          useStore.getState()._removeCheckedItem(row.item_id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'custom_shopping_items',
          filter: `meal_plan_id=eq.${planId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; ingredient: string; quantity: number; unit: string; category: IngredientCategory };
          const item: CustomShoppingListItem = {
            id: row.id,
            ingredient: row.ingredient,
            quantity: row.quantity,
            unit: row.unit,
            category: row.category,
          };
          useStore.getState()._addRemoteCustomItem(item);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'custom_shopping_items',
          filter: `meal_plan_id=eq.${planId}`,
        },
        (payload) => {
          const row = payload.old as { id: string };
          useStore.getState()._removeRemoteCustomItem(row.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [planId, userId]);

  // Visibility-change reconciliation: re-fetch state from Supabase when the
  // user returns to the app after backgrounding it (e.g. iOS Safari kills the
  // WebSocket while the page is hidden, so realtime events are lost).
  useEffect(() => {
    if (!planId) return;

    const supabase = createClient();

    async function refetchState(): Promise<void> {
      if (!planId) return;

      const [checkedResult, customResult] = await Promise.all([
        supabase
          .from('checked_items')
          .select('item_id, checked_by_email')
          .eq('meal_plan_id', planId),
        supabase
          .from('custom_shopping_items')
          .select('id, ingredient, quantity, unit, category')
          .eq('meal_plan_id', planId),
      ]);

      if (checkedResult.error) {
        console.error('[useRealtimeShoppingList] Error re-fetching checked_items:', checkedResult.error);
      } else {
        const checkedItems: Record<string, string> = {};
        for (const row of checkedResult.data ?? []) {
          checkedItems[row.item_id] = row.checked_by_email ?? '';
        }
        useStore.getState()._setCheckedItems(checkedItems);
      }

      if (customResult.error) {
        console.error('[useRealtimeShoppingList] Error re-fetching custom_shopping_items:', customResult.error);
      } else {
        const customItems: CustomShoppingListItem[] = (customResult.data ?? []).map((row) => ({
          id: row.id,
          ingredient: row.ingredient,
          quantity: Number(row.quantity),
          unit: row.unit,
          category: row.category as IngredientCategory,
        }));
        useStore.getState()._setCustomShoppingItems(customItems);
      }
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        return;
      }

      // Page became visible again — skip re-fetch if it was hidden only briefly.
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt === null || Date.now() - hiddenAt < MIN_HIDDEN_MS) return;

      refetchState().catch((err) => {
        console.error('[useRealtimeShoppingList] Visibility refetch failed:', err);
      });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [planId]);
}
