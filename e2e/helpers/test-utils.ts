import { Page } from '@playwright/test';

/**
 * Clear localStorage to reset app state.
 * Navigates to '/' first only when on about:blank, so localStorage access does
 * not throw a SecurityError in a beforeEach before any navigation has happened.
 */
export async function clearAppState(page: Page) {
  if (!page.url().startsWith('http')) {
    await page.goto('/');
  }
  await page.evaluate(() => {
    localStorage.clear();
  });
}

/**
 * Create a meal plan with default settings (empty plan, Saturday start).
 * Navigates to /plan/current after creation.
 */
export async function createDefaultPlan(page: Page) {
  await page.goto('/plan');
  await page.getByTestId('generate-plan-btn').click();
  await page.waitForURL('/plan/current');
}

/**
 * Seed localStorage with a plan that has meals pre-populated.
 * Uses real recipe IDs from the seed data.
 * startDay: 0=Monday (default: 5=Saturday to match app default)
 */
export async function createPlanWithMeals(page: Page, startDay = 5) {
  await page.evaluate((sd) => {
    const plan = {
      id: 'test-plan-1',
      createdAt: new Date().toISOString(),
      preferences: { startDay: sd },
      meals: [
        // Day 0
        { id: 'meal-t-0-b', dayIndex: 0, mealType: 'breakfast', recipeId: 'breakfast-1', servings: 4 },
        { id: 'meal-t-0-l', dayIndex: 0, mealType: 'lunch', recipeId: 'lunch-1', servings: 4 },
        { id: 'meal-t-0-d', dayIndex: 0, mealType: 'dinner', recipeId: 'dinner-1', servings: 4 },
        // Day 1
        { id: 'meal-t-1-b', dayIndex: 1, mealType: 'breakfast', recipeId: 'breakfast-2', servings: 4 },
        { id: 'meal-t-1-l', dayIndex: 1, mealType: 'lunch', recipeId: 'lunch-2', servings: 4 },
        { id: 'meal-t-1-d', dayIndex: 1, mealType: 'dinner', recipeId: 'dinner-2', servings: 4 },
        // Day 2
        { id: 'meal-t-2-b', dayIndex: 2, mealType: 'breakfast', recipeId: 'breakfast-3', servings: 4 },
        { id: 'meal-t-2-l', dayIndex: 2, mealType: 'lunch', recipeId: 'lunch-3', servings: 4 },
        { id: 'meal-t-2-d', dayIndex: 2, mealType: 'dinner', recipeId: 'dinner-3', servings: 4 },
        // Day 3
        { id: 'meal-t-3-b', dayIndex: 3, mealType: 'breakfast', recipeId: 'breakfast-4', servings: 4 },
        { id: 'meal-t-3-l', dayIndex: 3, mealType: 'lunch', recipeId: 'lunch-4', servings: 4 },
        { id: 'meal-t-3-d', dayIndex: 3, mealType: 'dinner', recipeId: 'dinner-4', servings: 4 },
        // Day 4
        { id: 'meal-t-4-b', dayIndex: 4, mealType: 'breakfast', recipeId: 'breakfast-5', servings: 4 },
        { id: 'meal-t-4-l', dayIndex: 4, mealType: 'lunch', recipeId: 'lunch-5', servings: 4 },
        { id: 'meal-t-4-d', dayIndex: 4, mealType: 'dinner', recipeId: 'dinner-5', servings: 4 },
        // Day 5
        { id: 'meal-t-5-b', dayIndex: 5, mealType: 'breakfast', recipeId: 'breakfast-1', servings: 4 },
        { id: 'meal-t-5-l', dayIndex: 5, mealType: 'lunch', recipeId: 'lunch-6', servings: 4 },
        { id: 'meal-t-5-d', dayIndex: 5, mealType: 'dinner', recipeId: 'dinner-6', servings: 4 },
        // Day 6
        { id: 'meal-t-6-b', dayIndex: 6, mealType: 'breakfast', recipeId: 'breakfast-2', servings: 4 },
        { id: 'meal-t-6-l', dayIndex: 6, mealType: 'lunch', recipeId: 'lunch-7', servings: 4 },
        { id: 'meal-t-6-d', dayIndex: 6, mealType: 'dinner', recipeId: 'dinner-7', servings: 4 },
      ],
    };

    const state = {
      state: {
        currentPlan: plan,
        checkedItems: {},
        userRecipes: [],
        customShoppingItems: [],
      },
      version: 2,
    };

    localStorage.setItem('food-plan-storage', JSON.stringify(state));
  }, startDay);

  // Navigate to plan view so Zustand picks up the seeded state.
  await page.goto('/plan/current');
  // Wait for at least one meal element to confirm the store has hydrated and
  // the plan is fully rendered before returning.
  await page.waitForSelector('[data-testid^="meal-"]', { state: 'visible', timeout: 15000 });
}
