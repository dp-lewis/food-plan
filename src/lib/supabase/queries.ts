import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';
import type { Recipe, Meal, MealPlan, CustomShoppingListItem } from '@/types';
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

export async function getCheckedItems(planId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('checked_items')
    .select('item_id')
    .eq('meal_plan_id', planId);
  if (error) throw error;
  return (data ?? []).map((row) => row.item_id);
}

export async function upsertCheckedItem(
  planId: string,
  itemId: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('checked_items')
    .upsert(
      { meal_plan_id: planId, item_id: itemId, checked_by: userId },
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
