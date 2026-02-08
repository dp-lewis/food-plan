import { MealPlan, MealPlanPreferences, Meal, MealType, Recipe } from '@/types';
import { getRecipesByMealType } from '@/data/recipes';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateId(): string {
  return crypto.randomUUID();
}

export function generateMealPlan(preferences: MealPlanPreferences, userRecipes: Recipe[] = []): MealPlan {
  const meals: Meal[] = [];
  const mealTypes: MealType[] = [];

  if (preferences.includeMeals.breakfast) mealTypes.push('breakfast');
  if (preferences.includeMeals.lunch) mealTypes.push('lunch');
  if (preferences.includeMeals.dinner) mealTypes.push('dinner');

  for (const mealType of mealTypes) {
    const availableRecipes = getRecipesByMealType(mealType, userRecipes);
    const shuffledRecipes = shuffleArray(availableRecipes);

    for (let dayIndex = 0; dayIndex < preferences.numberOfDays; dayIndex++) {
      // Cycle through recipes if we have more days than recipes
      const recipeIndex = dayIndex % shuffledRecipes.length;
      const recipe = shuffledRecipes[recipeIndex];

      meals.push({
        id: generateId(),
        dayIndex,
        mealType,
        recipeId: recipe.id,
        servings: recipe.servings,
      });
    }
  }

  return {
    id: generateId(),
    createdAt: new Date().toISOString(),
    preferences,
    meals,
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
