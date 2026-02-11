import { describe, it, expect } from 'vitest';
import {
  dbRecipeToApp,
  dbMealToApp,
  dbMealPlanToApp,
  dbCustomItemToApp,
  appRecipeToDb,
  appMealToDb,
  appMealPlanToDb,
  appCustomItemToDb,
} from '../mappers';
import type { Tables } from '@/types/supabase';
import type { Recipe, Meal, MealPlan, CustomShoppingListItem } from '@/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const dbRecipe: Tables<'recipes'> = {
  id: 'recipe-1',
  title: 'Test Recipe',
  description: null,
  meal_type: 'dinner',
  prep_time: 15,
  cook_time: 30,
  servings: 4,
  difficulty: 'easy',
  tags: ['quick'],
  estimated_cost: 'low',
  ingredients: [{ name: 'Salt', quantity: 1, unit: 'tsp', category: 'pantry' }],
  instructions: ['Step 1', 'Step 2'],
  source_url: 'https://example.com',
  source_name: 'Example',
  notes: null,
  user_id: 'user-123',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

const dbMealRow: Tables<'meals'> = {
  id: 'meal-1',
  meal_plan_id: 'plan-1',
  day_index: 0,
  meal_type: 'dinner',
  recipe_id: 'recipe-1',
  servings: 4,
};

const dbPlanRow: Tables<'meal_plans'> = {
  id: 'plan-1',
  user_id: 'user-123',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  preferences: { startDay: 5 },
  share_code: null,
};

const dbCustomItemRow: Tables<'custom_shopping_items'> = {
  id: 'custom-1',
  meal_plan_id: 'plan-1',
  ingredient: 'Paper towels',
  quantity: 2,
  unit: 'rolls',
  category: 'uncategorized',
};

const appRecipe: Recipe = {
  id: 'recipe-1',
  title: 'Test Recipe',
  description: '',
  mealType: 'dinner',
  prepTime: 15,
  cookTime: 30,
  servings: 4,
  difficulty: 'easy',
  tags: ['quick'],
  estimatedCost: 'low',
  ingredients: [{ name: 'Salt', quantity: 1, unit: 'tsp', category: 'pantry' }],
  instructions: ['Step 1', 'Step 2'],
  sourceUrl: 'https://example.com',
  sourceName: 'Example',
  isUserRecipe: true,
  notes: undefined,
};

const appMeal: Meal = {
  id: 'meal-1',
  dayIndex: 0,
  mealType: 'dinner',
  recipeId: 'recipe-1',
  servings: 4,
};

const appPlan: MealPlan = {
  id: 'plan-1',
  createdAt: '2025-01-01T00:00:00Z',
  preferences: { startDay: 5 },
  meals: [appMeal],
};

const appCustomItem: CustomShoppingListItem = {
  id: 'custom-1',
  ingredient: 'Paper towels',
  quantity: 2,
  unit: 'rolls',
  category: 'uncategorized',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('dbRecipeToApp', () => {
  it('converts a DB recipe row to an app Recipe', () => {
    const result = dbRecipeToApp(dbRecipe);
    expect(result).toEqual(appRecipe);
  });

  it('infers isUserRecipe=true when user_id is set', () => {
    const result = dbRecipeToApp({ ...dbRecipe, user_id: 'user-123' });
    expect(result.isUserRecipe).toBe(true);
  });

  it('infers isUserRecipe=false when user_id is null (built-in)', () => {
    const result = dbRecipeToApp({ ...dbRecipe, user_id: null });
    expect(result.isUserRecipe).toBe(false);
  });

  it('maps null description to empty string', () => {
    const result = dbRecipeToApp({ ...dbRecipe, description: null });
    expect(result.description).toBe('');
  });

  it('maps non-null description as-is', () => {
    const result = dbRecipeToApp({ ...dbRecipe, description: 'A tasty dish' });
    expect(result.description).toBe('A tasty dish');
  });
});

describe('dbMealToApp', () => {
  it('converts a DB meal row to an app Meal', () => {
    const result = dbMealToApp(dbMealRow);
    expect(result).toEqual(appMeal);
  });
});

describe('dbMealPlanToApp', () => {
  it('assembles a MealPlan from plan row + meal rows', () => {
    const result = dbMealPlanToApp(dbPlanRow, [dbMealRow]);
    expect(result).toEqual(appPlan);
  });

  it('returns empty meals array when no meal rows', () => {
    const result = dbMealPlanToApp(dbPlanRow, []);
    expect(result.meals).toEqual([]);
  });
});

describe('dbCustomItemToApp', () => {
  it('converts a DB custom item row to an app CustomShoppingListItem', () => {
    const result = dbCustomItemToApp(dbCustomItemRow);
    expect(result).toEqual(appCustomItem);
  });
});

describe('appRecipeToDb', () => {
  it('converts all camelCase fields to snake_case and sets user_id', () => {
    const result = appRecipeToDb(appRecipe, 'user-456');
    expect(result.meal_type).toBe('dinner');
    expect(result.prep_time).toBe(15);
    expect(result.cook_time).toBe(30);
    expect(result.estimated_cost).toBe('low');
    expect(result.source_url).toBe('https://example.com');
    expect(result.source_name).toBe('Example');
    expect(result.user_id).toBe('user-456');
  });

  it('maps empty description to null', () => {
    const result = appRecipeToDb({ ...appRecipe, description: '' }, 'user-1');
    expect(result.description).toBeNull();
  });
});

describe('appMealToDb', () => {
  it('converts Meal to DB insert shape with plan ID', () => {
    const result = appMealToDb(appMeal, 'plan-1');
    expect(result.meal_plan_id).toBe('plan-1');
    expect(result.day_index).toBe(0);
    expect(result.meal_type).toBe('dinner');
    expect(result.recipe_id).toBe('recipe-1');
  });
});

describe('appMealPlanToDb', () => {
  it('converts MealPlan to DB insert shape with user ID', () => {
    const result = appMealPlanToDb(appPlan, 'user-789');
    expect(result.id).toBe('plan-1');
    expect(result.user_id).toBe('user-789');
    expect(result.created_at).toBe('2025-01-01T00:00:00Z');
    expect(result.preferences).toEqual({ startDay: 5 });
  });
});

describe('appCustomItemToDb', () => {
  it('converts CustomShoppingListItem to DB insert shape with plan ID', () => {
    const result = appCustomItemToDb(appCustomItem, 'plan-1');
    expect(result.meal_plan_id).toBe('plan-1');
    expect(result.ingredient).toBe('Paper towels');
    expect(result.quantity).toBe(2);
    expect(result.unit).toBe('rolls');
    expect(result.category).toBe('uncategorized');
  });
});

describe('round-trip', () => {
  it('app recipe → db → app preserves data', () => {
    const dbRow = {
      ...appRecipeToDb(appRecipe, 'user-123'),
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    } as Tables<'recipes'>;
    const roundTripped = dbRecipeToApp(dbRow);
    expect(roundTripped).toEqual(appRecipe);
  });

  it('app meal → db → app preserves data', () => {
    const dbRow = appMealToDb(appMeal, 'plan-1') as Tables<'meals'>;
    const roundTripped = dbMealToApp(dbRow);
    expect(roundTripped).toEqual(appMeal);
  });

  it('app custom item → db → app preserves data', () => {
    const dbRow = appCustomItemToDb(appCustomItem, 'plan-1') as Tables<'custom_shopping_items'>;
    const roundTripped = dbCustomItemToApp(dbRow);
    expect(roundTripped).toEqual(appCustomItem);
  });
});
