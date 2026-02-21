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
  getRecipesByIds,
  getCheckedItems,
  getCustomItems,
  getPlanOwner,
  getPlanAccess,
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

async function requirePlanAccess(planId: string, userId: string): Promise<void> {
  const hasAccess = await getPlanAccess(planId, userId);
  if (!hasAccess) {
    throw new Error('You do not have access to this plan');
  }
}

export interface ActivePlanData {
  plan: MealPlan;
  role: PlanRole;
  recipes: Recipe[];
  checkedItems: Record<string, string>;
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
    const planRecipeIds = [...new Set(plan.meals.map(m => m.recipeId))];

    const [ownRecipes, planRecipes, checkedItems, customItems] = await Promise.all([
      getUserRecipes(user.id),
      getRecipesByIds(planRecipeIds),
      getCheckedItems(plan.id),
      getCustomItems(plan.id),
    ]);

    // Merge own recipes with plan recipes (for members who joined a shared plan)
    const recipes = [...ownRecipes];
    for (const r of planRecipes) {
      if (!recipes.some(own => own.id === r.id)) {
        recipes.push(r);
      }
    }

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
    // No requirePlanOwner here — this handles initial upload (plan may not
    // exist in DB yet) and RLS on meal_plans already enforces user_id = auth.uid().
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
    await requirePlanAccess(planId, user.id);
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

export async function deletePlanAction(planId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthUser();
    await requirePlanOwner(planId, user.id);
    const supabase = await createClient();
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', planId);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.error('[deletePlanAction]', e);
    return { success: false, error: e instanceof Error ? e.message : 'Failed to delete plan' };
  }
}
