'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/store';
import type { CustomShoppingListItem, IngredientCategory } from '@/types';

export function useRealtimeShoppingList(planId: string | null, userId: string | null) {
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
}
