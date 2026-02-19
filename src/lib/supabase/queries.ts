import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';
import type { Recipe, Meal, MealPlan, CustomShoppingListItem, SharedPlanData, PlanRole } from '@/types';
import {
  dbRecipeToApp,
  dbMealToApp,
  dbMealPlanToApp,
  dbCustomItemToApp,
  appRecipeToDb,
  appMealToDb,
  appMealPlanToDb,
  appCustomItemToDb,
} from './mappers';

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------

export async function getUserRecipes(userId: string): Promise<Recipe[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(dbRecipeToApp);
}

export async function getRecipesByIds(ids: string[]): Promise<Recipe[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .in('id', ids);
  if (error) throw error;
  return (data ?? []).map(dbRecipeToApp);
}

export async function insertRecipe(
  recipe: Recipe,
  userId: string,
): Promise<Recipe> {
  const supabase = await createClient();
  const row = appRecipeToDb(recipe, userId);
  const { data, error } = await supabase
    .from('recipes')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return dbRecipeToApp(data);
}

export async function deleteRecipe(recipeId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Meal Plans
// ---------------------------------------------------------------------------

export async function getUserMealPlan(
  userId: string,
): Promise<MealPlan | null> {
  const supabase = await createClient();
  const { data: planRow, error: planError } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (planError) throw planError;
  if (!planRow) return null;

  const { data: mealRows, error: mealsError } = await supabase
    .from('meals')
    .select('*')
    .eq('meal_plan_id', planRow.id);
  if (mealsError) throw mealsError;

  return dbMealPlanToApp(planRow, mealRows ?? []);
}

export async function upsertMealPlan(
  plan: MealPlan,
  userId: string,
): Promise<MealPlan> {
  const supabase = await createClient();

  // Upsert the plan row
  const planRow = appMealPlanToDb(plan, userId);
  const { data: upsertedPlan, error: planError } = await supabase
    .from('meal_plans')
    .upsert(planRow, { onConflict: 'id' })
    .select()
    .single();
  if (planError) throw planError;

  // Delete existing meals for this plan, then batch insert new ones
  const { error: deleteError } = await supabase
    .from('meals')
    .delete()
    .eq('meal_plan_id', plan.id);
  if (deleteError) throw deleteError;

  let mealRows: Tables<'meals'>[] = [];

  if (plan.meals.length > 0) {
    const mealInserts = plan.meals.map((m) => appMealToDb(m, plan.id));
    const { data, error: mealsError } = await supabase
      .from('meals')
      .insert(mealInserts)
      .select();
    if (mealsError) throw mealsError;
    mealRows = data;
  }

  return dbMealPlanToApp(upsertedPlan, mealRows ?? []);
}

// ---------------------------------------------------------------------------
// Meals (individual operations)
// ---------------------------------------------------------------------------

export async function insertMeal(
  meal: Meal,
  planId: string,
): Promise<Meal> {
  const supabase = await createClient();
  const row = appMealToDb(meal, planId);
  const { data, error } = await supabase
    .from('meals')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return dbMealToApp(data);
}

export async function deleteMeal(mealId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', mealId);
  if (error) throw error;
}

export async function updateMealRecipe(
  mealId: string,
  recipeId: string,
): Promise<Meal> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('meals')
    .update({ recipe_id: recipeId })
    .eq('id', mealId)
    .select()
    .single();
  if (error) throw error;
  return dbMealToApp(data);
}

// ---------------------------------------------------------------------------
// Checked Items
// ---------------------------------------------------------------------------

export async function getCheckedItems(planId: string): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('checked_items')
    .select('item_id, checked_by_email')
    .eq('meal_plan_id', planId);
  if (error) throw error;
  const record: Record<string, string> = {};
  for (const row of data ?? []) {
    record[row.item_id] = row.checked_by_email ?? '';
  }
  return record;
}

export async function upsertCheckedItem(
  planId: string,
  itemId: string,
  userId: string,
  userEmail?: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('checked_items')
    .upsert(
      { meal_plan_id: planId, item_id: itemId, checked_by: userId, checked_by_email: userEmail ?? null },
      { onConflict: 'meal_plan_id,item_id' },
    );
  if (error) throw error;
}

export async function deleteCheckedItem(
  planId: string,
  itemId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('checked_items')
    .delete()
    .eq('meal_plan_id', planId)
    .eq('item_id', itemId);
  if (error) throw error;
}

export async function clearCheckedItems(planId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('checked_items')
    .delete()
    .eq('meal_plan_id', planId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Custom Shopping Items
// ---------------------------------------------------------------------------

export async function getCustomItems(
  planId: string,
): Promise<CustomShoppingListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('custom_shopping_items')
    .select('*')
    .eq('meal_plan_id', planId);
  if (error) throw error;
  return (data ?? []).map(dbCustomItemToApp);
}

export async function insertCustomItem(
  item: CustomShoppingListItem,
  planId: string,
): Promise<CustomShoppingListItem> {
  const supabase = await createClient();
  const row = appCustomItemToDb(item, planId);
  const { data, error } = await supabase
    .from('custom_shopping_items')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return dbCustomItemToApp(data);
}

export async function deleteCustomItem(itemId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('custom_shopping_items')
    .delete()
    .eq('id', itemId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Sharing
// ---------------------------------------------------------------------------

export async function getShareCode(planId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('meal_plans')
    .select('share_code')
    .eq('id', planId)
    .single();
  if (error) throw error;
  return data?.share_code ?? null;
}

export async function setShareCode(
  planId: string,
  shareCode: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('meal_plans')
    .update({ share_code: shareCode })
    .eq('id', planId);
  if (error) throw error;
}

export async function clearShareCode(planId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('meal_plans')
    .update({ share_code: null })
    .eq('id', planId);
  if (error) throw error;
}

export async function getPlanIdByShareCode(
  shareCode: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('share_code', shareCode)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function getMealPlanByShareCode(
  shareCode: string,
): Promise<SharedPlanData | null> {
  const supabase = await createClient();

  // Fetch the shared plan
  const { data: planRow, error: planError } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('share_code', shareCode)
    .maybeSingle();
  if (planError) throw planError;
  if (!planRow) return null;

  // Fetch meals for this plan
  const { data: mealRows, error: mealsError } = await supabase
    .from('meals')
    .select('*')
    .eq('meal_plan_id', planRow.id);
  if (mealsError) throw mealsError;

  // Fetch user recipes referenced by meals
  const recipeIds = [...new Set((mealRows ?? []).map((m) => m.recipe_id))];
  let recipes: Recipe[] = [];
  if (recipeIds.length > 0) {
    const { data: recipeRows, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .in('id', recipeIds);
    if (recipesError) throw recipesError;
    recipes = (recipeRows ?? []).map(dbRecipeToApp);
  }

  // Fetch custom shopping items for this plan
  const { data: customRows, error: customError } = await supabase
    .from('custom_shopping_items')
    .select('*')
    .eq('meal_plan_id', planRow.id);
  if (customError) throw customError;

  return {
    plan: dbMealPlanToApp(planRow, mealRows ?? []),
    recipes,
    customItems: (customRows ?? []).map(dbCustomItemToApp),
  };
}

// ---------------------------------------------------------------------------
// Plan Members
// ---------------------------------------------------------------------------

export async function joinPlan(
  planId: string,
  userId: string,
  userEmail?: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('plan_members')
    .insert({ meal_plan_id: planId, user_id: userId, role: 'member', user_email: userEmail ?? null });
  if (error) throw error;
}

export async function leavePlan(
  planId: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('plan_members')
    .delete()
    .eq('meal_plan_id', planId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function removeAllMemberships(userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('plan_members')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

export async function getPlanOwner(planId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('meal_plans')
    .select('user_id')
    .eq('id', planId)
    .maybeSingle();
  if (error) throw error;
  return data?.user_id ?? null;
}

export async function getPlanAccess(planId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();

  // Check if owner
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('user_id')
    .eq('id', planId)
    .maybeSingle();
  if (plan?.user_id === userId) return true;

  // Check if member
  const { data: membership } = await supabase
    .from('plan_members')
    .select('user_id')
    .eq('meal_plan_id', planId)
    .eq('user_id', userId)
    .maybeSingle();
  return membership !== null;
}

export async function getUserActivePlan(
  userId: string,
): Promise<{ plan: MealPlan; role: PlanRole } | null> {
  const supabase = await createClient();

  // Check for membership first (most recent join)
  const { data: membership, error: memberError } = await supabase
    .from('plan_members')
    .select('meal_plan_id, role')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (memberError) throw memberError;

  if (membership) {
    // Load the joined plan
    const { data: planRow, error: planError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', membership.meal_plan_id)
      .maybeSingle();
    if (planError) throw planError;
    if (!planRow) return null; // Plan was deleted

    const { data: mealRows, error: mealsError } = await supabase
      .from('meals')
      .select('*')
      .eq('meal_plan_id', planRow.id);
    if (mealsError) throw mealsError;

    return {
      plan: dbMealPlanToApp(planRow, mealRows ?? []),
      role: membership.role as PlanRole,
    };
  }

  // Fall back to owned plan
  const ownedPlan = await getUserMealPlan(userId);
  if (ownedPlan) {
    return { plan: ownedPlan, role: 'owner' };
  }

  return null;
}
