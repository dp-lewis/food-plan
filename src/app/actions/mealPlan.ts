'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types';
import type { MealPlan, Meal, Recipe, CustomShoppingListItem, PlanRole } from '@/types';
import {
  getUserMealPlan,
  upsertMealPlan,
  insertMeal,
  deleteMeal,
  updateMealRecipe,
  getUserActivePlan,
  getUserRecipes,
  getCheckedItems,
  getCustomItems,
  getPlanOwner,
} from '@/lib/supabase/queries';

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user;
}

async function requirePlanOwner(planId: string, userId: string): Promise<void> {
  const ownerId = await getPlanOwner(planId);
  if (ownerId !== userId) {
    throw new Error('Only the plan owner can modify this plan');
  }
}

export interface ActivePlanData {
  plan: MealPlan;
  role: PlanRole;
  recipes: Recipe[];
  checkedItems: string[];
  customItems: CustomShoppingListItem[];
}

export async function loadActivePlan(): Promise<ActionResult<ActivePlanData | null>> {
  try {
    const user = await getAuthUser();
    const result = await getUserActivePlan(user.id);
    if (!result) {
      return { data: null, error: null };
    }

    const { plan, role } = result;
    const [recipes, checkedItems, customItems] = await Promise.all([
      getUserRecipes(user.id),
      getCheckedItems(plan.id),
      getCustomItems(plan.id),
    ]);

    return {
      data: { plan, role, recipes, checkedItems, customItems },
      error: null,
    };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to load active plan' };
  }
}

export async function loadMealPlan(): Promise<ActionResult<MealPlan | null>> {
  try {
    const user = await getAuthUser();
    const plan = await getUserMealPlan(user.id);
    return { data: plan, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to load meal plan' };
  }
}

export async function syncMealPlan(plan: MealPlan): Promise<ActionResult<MealPlan>> {
  try {
    const user = await getAuthUser();
    await requirePlanOwner(plan.id, user.id);
    const result = await upsertMealPlan(plan, user.id);
    return { data: result, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to sync meal plan' };
  }
}

export async function addMealAction(
  planId: string,
  meal: Meal,
): Promise<ActionResult<Meal>> {
  try {
    const user = await getAuthUser();
    await requirePlanOwner(planId, user.id);
    const result = await insertMeal(meal, planId);
    return { data: result, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to add meal' };
  }
}

export async function removeMealAction(mealId: string): Promise<ActionResult<void>> {
  try {
    await getAuthUser();
    await deleteMeal(mealId);
    return { data: undefined, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to remove meal' };
  }
}

export async function swapMealAction(
  mealId: string,
  recipeId: string,
): Promise<ActionResult<Meal>> {
  try {
    await getAuthUser();
    const result = await updateMealRecipe(mealId, recipeId);
    return { data: result, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to swap meal' };
  }
}
