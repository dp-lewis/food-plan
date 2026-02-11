import type { Tables, TablesInsert } from '@/types/supabase';
import type {
  Recipe,
  Meal,
  MealPlan,
  MealPlanPreferences,
  CustomShoppingListItem,
  Ingredient,
} from '@/types';

// ---------------------------------------------------------------------------
// DB → App
// ---------------------------------------------------------------------------

export function dbRecipeToApp(row: Tables<'recipes'>): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    mealType: row.meal_type,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    difficulty: row.difficulty,
    tags: row.tags,
    estimatedCost: row.estimated_cost,
    ingredients: row.ingredients as unknown as Ingredient[],
    instructions: row.instructions,
    sourceUrl: row.source_url ?? undefined,
    sourceName: row.source_name ?? undefined,
    isUserRecipe: row.user_id !== null,
    notes: row.notes ?? undefined,
  };
}

export function dbMealToApp(row: Tables<'meals'>): Meal {
  return {
    id: row.id,
    dayIndex: row.day_index,
    mealType: row.meal_type,
    recipeId: row.recipe_id,
    servings: row.servings,
  };
}

export function dbMealPlanToApp(
  row: Tables<'meal_plans'>,
  mealRows: Tables<'meals'>[],
): MealPlan {
  return {
    id: row.id,
    createdAt: row.created_at,
    preferences: row.preferences as unknown as MealPlanPreferences,
    meals: mealRows.map(dbMealToApp),
  };
}

export function dbCustomItemToApp(
  row: Tables<'custom_shopping_items'>,
): CustomShoppingListItem {
  return {
    id: row.id,
    ingredient: row.ingredient,
    quantity: Number(row.quantity),
    unit: row.unit,
    category: row.category,
  };
}

// ---------------------------------------------------------------------------
// App → DB
// ---------------------------------------------------------------------------

export function appRecipeToDb(
  recipe: Recipe,
  userId: string,
): TablesInsert<'recipes'> {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description || null,
    meal_type: recipe.mealType,
    prep_time: recipe.prepTime,
    cook_time: recipe.cookTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    tags: recipe.tags,
    estimated_cost: recipe.estimatedCost,
    ingredients: recipe.ingredients as unknown as TablesInsert<'recipes'>['ingredients'],
    instructions: recipe.instructions,
    source_url: recipe.sourceUrl ?? null,
    source_name: recipe.sourceName ?? null,
    notes: recipe.notes ?? null,
    user_id: userId,
  };
}

export function appMealToDb(
  meal: Meal,
  planId: string,
): TablesInsert<'meals'> {
  return {
    id: meal.id,
    meal_plan_id: planId,
    day_index: meal.dayIndex,
    meal_type: meal.mealType,
    recipe_id: meal.recipeId,
    servings: meal.servings,
  };
}

export function appMealPlanToDb(
  plan: MealPlan,
  userId: string,
): TablesInsert<'meal_plans'> {
  return {
    id: plan.id,
    user_id: userId,
    created_at: plan.createdAt,
    preferences: plan.preferences as unknown as TablesInsert<'meal_plans'>['preferences'],
  };
}

export function appCustomItemToDb(
  item: CustomShoppingListItem,
  planId: string,
): TablesInsert<'custom_shopping_items'> {
  return {
    id: item.id,
    meal_plan_id: planId,
    ingredient: item.ingredient,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
  };
}
