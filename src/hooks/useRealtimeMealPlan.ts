'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/store';
import type { CustomShoppingListItem, IngredientCategory, Meal, MealType } from '@/types';

// Minimum time the page must be hidden before we re-fetch on return (ms).
// This avoids unnecessary round-trips for brief tab switches.
const MIN_HIDDEN_MS = 3_000;

type MealRow = {
  id: string;
  meal_plan_id: string;
  day_index: number;
  meal_type: string;
  recipe_id: string;
  servings: number;
  user_id?: string;
};

type CustomItemRow = {
  id: string;
  meal_plan_id: string;
  ingredient: string;
  quantity: number;
  unit: string;
  category: string;
};

function mealRowToApp(row: MealRow): Meal {
  return {
    id: row.id,
    dayIndex: row.day_index,
    mealType: row.meal_type as MealType,
    recipeId: row.recipe_id,
    servings: row.servings,
  };
}

function customItemRowToApp(row: CustomItemRow): CustomShoppingListItem {
  return {
    id: row.id,
    ingredient: row.ingredient,
    quantity: Number(row.quantity),
    unit: row.unit,
    category: row.category as IngredientCategory,
  };
}

export function useRealtimeMealPlan(
  planId: string | null,
  userId: string | null,
  onRemoteChange?: () => void,
): void {
  // Track when the page was hidden so we can decide whether to re-fetch.
  const hiddenAtRef = useRef<number | null>(null);
  // Hold the latest callback in a ref to avoid re-creating the WebSocket
  // subscription whenever the parent component re-renders with a new inline fn.
  const onRemoteChangeRef = useRef(onRemoteChange);
  onRemoteChangeRef.current = onRemoteChange;

  // WebSocket realtime subscription
  useEffect(() => {
    if (!planId || !userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`meal-plan-${planId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meals',
          filter: `meal_plan_id=eq.${planId}`,
        },
        (payload) => {
          const row = payload.new as MealRow;
          if (row.user_id === userId) return; // skip self
          useStore.getState()._applyRemoteMealInsert(mealRowToApp(row));
          onRemoteChangeRef.current?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'meals',
          filter: `meal_plan_id=eq.${planId}`,
        },
        (payload) => {
          const row = payload.new as MealRow;
          if (row.user_id === userId) return; // skip self
          useStore.getState()._applyRemoteMealUpdate(mealRowToApp(row));
          onRemoteChangeRef.current?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'meals',
          filter: `meal_plan_id=eq.${planId}`,
        },
        (payload) => {
          const row = payload.old as MealRow;
          useStore.getState()._applyRemoteMealDelete(row.id);
          onRemoteChangeRef.current?.();
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
          const row = payload.new as CustomItemRow;
          useStore.getState()._applyRemoteCustomItemInsert(customItemRowToApp(row));
          onRemoteChangeRef.current?.();
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
          const row = payload.old as CustomItemRow;
          useStore.getState()._applyRemoteCustomItemDelete(row.id);
          onRemoteChangeRef.current?.();
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

      const [mealsResult, customResult] = await Promise.all([
        supabase
          .from('meals')
          .select('id, meal_plan_id, day_index, meal_type, recipe_id, servings, user_id')
          .eq('meal_plan_id', planId),
        supabase
          .from('custom_shopping_items')
          .select('id, meal_plan_id, ingredient, quantity, unit, category')
          .eq('meal_plan_id', planId),
      ]);

      if (mealsResult.error) {
        console.error('[useRealtimeMealPlan] Error re-fetching meals:', mealsResult.error);
      } else {
        const freshMeals = (mealsResult.data ?? []).map((row) =>
          mealRowToApp(row as unknown as MealRow)
        );
        const store = useStore.getState();
        const currentMeals = store.currentPlan?.meals ?? [];

        // Insert meals that are in DB but not in local state
        const currentIds = new Set(currentMeals.map((m) => m.id));
        for (const meal of freshMeals) {
          if (!currentIds.has(meal.id)) {
            store._applyRemoteMealInsert(meal);
          }
        }

        // Delete meals that are in local state but not in DB
        const freshIds = new Set(freshMeals.map((m) => m.id));
        for (const meal of currentMeals) {
          if (!freshIds.has(meal.id)) {
            store._applyRemoteMealDelete(meal.id);
          }
        }
      }

      if (customResult.error) {
        console.error('[useRealtimeMealPlan] Error re-fetching custom_shopping_items:', customResult.error);
      } else {
        const customItems: CustomShoppingListItem[] = (customResult.data ?? []).map((row) =>
          customItemRowToApp(row as unknown as CustomItemRow)
        );
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
        console.error('[useRealtimeMealPlan] Visibility refetch failed:', err);
      });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [planId]);
}
