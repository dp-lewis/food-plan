import { MealPlan, MealPlanPreferences, Recipe } from '@/types';
import { getRecipesByMealType } from '@/data/recipes';
import { generateUUID } from './uuid';

function generateId(): string {
  return generateUUID();
}

export function createEmptyPlan(preferences: MealPlanPreferences): MealPlan {
  const { startDay } = preferences;
  // Compute weekStart: next occurrence of startDay from today (inclusive)
  const today = new Date();
  const jsToday = today.getDay(); // 0=Sun...6=Sat
  const todayWeekday = jsToday === 0 ? 6 : jsToday - 1; // convert to 0=Mon...6=Sun
  const daysUntilStartDay = (startDay - todayWeekday + 7) % 7;
  const weekStartDate = new Date(today);
  weekStartDate.setDate(today.getDate() + daysUntilStartDay);
  const weekStart = weekStartDate.toISOString().split('T')[0];

  return {
    id: generateId(),
    createdAt: new Date().toISOString(),
    preferences: { ...preferences, weekStart },
    meals: [],
  };
}

export function swapMeal(
  plan: MealPlan,
  mealId: string,
  userRecipes: Recipe[] = [],
  selectedRecipeId?: string
): MealPlan {
  const mealIndex = plan.meals.findIndex((m) => m.id === mealId);
  if (mealIndex === -1) return plan;

  const meal = plan.meals[mealIndex];

  let newRecipeId: string;

  if (selectedRecipeId) {
    // Use the user-selected recipe
    newRecipeId = selectedRecipeId;
  } else {
    // Random selection logic
    const availableRecipes = getRecipesByMealType(meal.mealType, userRecipes);

    // Get recipes not currently used for this meal type
    const usedRecipeIds = plan.meals
      .filter((m) => m.mealType === meal.mealType)
      .map((m) => m.recipeId);

    let newRecipes = availableRecipes.filter((r) => !usedRecipeIds.includes(r.id));

    // If all recipes are used, allow any recipe except the current one
    if (newRecipes.length === 0) {
      newRecipes = availableRecipes.filter((r) => r.id !== meal.recipeId);
    }

    if (newRecipes.length === 0) return plan;

    const newRecipe = newRecipes[Math.floor(Math.random() * newRecipes.length)];
    newRecipeId = newRecipe.id;
  }

  const updatedMeals = [...plan.meals];
  updatedMeals[mealIndex] = {
    ...meal,
    recipeId: newRecipeId,
  };

  return {
    ...plan,
    meals: updatedMeals,
  };
}
