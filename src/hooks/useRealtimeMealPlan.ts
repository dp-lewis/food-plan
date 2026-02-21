'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/store';
import { getRecipeById } from '@/data/recipes';
import { dbRecipeToApp } from '@/lib/supabase/mappers';
import type { CustomShoppingListItem, IngredientCategory, Meal, MealType } from '@/types';
import type { Tables } from '@/types/supabase';

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

type MealPlanRow = {
  id: string;
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
          event: 'DELETE',
          schema: 'public',
          table: 'meal_plans',
          filter: `id=eq.${planId}`,
        },
        (_payload) => {
          // The plan was deleted by the owner — clear local state for all clients.
          useStore.getState()._clearCurrentPlan();
        }
      )
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
          const store = useStore.getState();
          store._applyRemoteMealInsert(mealRowToApp(row));
          // Fetch the recipe if it is not already available locally. This
          // handles the case where the collaborator used one of their own
          // recipes that the current user has never seen before.
          if (row.recipe_id && !getRecipeById(row.recipe_id, store.userRecipes)) {
            supabase
              .from('recipes')
              .select('*')
              .eq('id', row.recipe_id)
              .single()
              .then(({ data }) => {
                if (data) {
                  useStore.getState()._addRemoteRecipe(dbRecipeToApp(data as Tables<'recipes'>));
                }
              });
          }
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

        // Insert meals that are in DB but not in local state.
        // Collect recipe IDs that are not yet available locally so we can
        // batch-fetch them after updating the plan.
        const currentIds = new Set(currentMeals.map((m) => m.id));
        const missingRecipeIds = new Set<string>();
        for (const meal of freshMeals) {
          if (!currentIds.has(meal.id)) {
            store._applyRemoteMealInsert(meal);
            if (meal.recipeId && !getRecipeById(meal.recipeId, store.userRecipes)) {
              missingRecipeIds.add(meal.recipeId);
            }
          }
        }

        // Delete meals that are in local state but not in DB
        const freshIds = new Set(freshMeals.map((m) => m.id));
        for (const meal of currentMeals) {
          if (!freshIds.has(meal.id)) {
            store._applyRemoteMealDelete(meal.id);
          }
        }

        // Fetch any recipes that are referenced but not yet in the store
        if (missingRecipeIds.size > 0) {
          const { data: recipeRows } = await supabase
            .from('recipes')
            .select('*')
            .in('id', [...missingRecipeIds]);
          for (const row of recipeRows ?? []) {
            useStore.getState()._addRemoteRecipe(dbRecipeToApp(row as Tables<'recipes'>));
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
