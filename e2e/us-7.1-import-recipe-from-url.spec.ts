import { test, expect } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

/**
 * US-7.1: Import recipe from URL
 *
 * As a home cook
 * I want to import recipes from my favourite food websites
 * So that I can include trusted recipes in my meal plans
 *
 * Acceptance Criteria:
 * - [ ] Can navigate to "My Recipes" from the dashboard
 * - [ ] Can enter a URL to import a recipe
 * - [ ] Recipe title and ingredients are extracted from the page
 * - [ ] Can select meal type (breakfast, lunch, dinner) for imported recipe
 * - [ ] Can adjust ingredient categories before saving
 * - [ ] Saved recipes appear in "My Recipes" list
 * - [ ] Imported recipes link to original website for cooking instructions
 * - [ ] Imported recipe ingredients appear on shopping list when used in a plan
 */

// Mock recipe data that simulates what the API would return
const mockParsedRecipe = {
  title: 'Honey Garlic Chicken',
  description: 'A delicious honey garlic chicken recipe',
  prepTime: 15,
  cookTime: 25,
  servings: 4,
  ingredients: [
    '500g chicken thighs',
    '3 tablespoons honey',
    '4 cloves garlic',
    '2 tablespoons soy sauce',
  ],
  instructions: ['Step 1', 'Step 2', 'Step 3'],
  sourceUrl: 'https://www.recipetineats.com/honey-garlic-chicken/',
  sourceName: 'Recipetineats',
};

test.describe('US-7.1: Import recipe from URL', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the parse-recipe API endpoint
    await page.route('**/api/parse-recipe', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockParsedRecipe),
      });
    });

    await page.goto('/');
    await clearAppState(page);
  });

  test('Can navigate to "My Recipes" from the dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('tab-recipes').click();
    await expect(page).toHaveURL('/recipes');
    await expect(page.getByTestId('my-recipes-page')).toBeVisible();
  });

  test('Can enter a URL to import a recipe', async ({ page }) => {
    await page.goto('/recipes');

    // Click Import URL to open drawer
    await page.getByTestId('import-recipe-btn').click();

    const urlInput = page.getByTestId('import-url-input');
    await expect(urlInput).toBeVisible();

    await urlInput.fill('https://www.recipetineats.com/honey-garlic-chicken/');
    await page.getByTestId('fetch-recipe-btn').click();

    // Should navigate to preview page
    await expect(page).toHaveURL('/recipes/add');
    await expect(page.getByTestId('preview-recipe-page')).toBeVisible();
  });

  test('Recipe title and ingredients are extracted from the page', async ({ page }) => {
    await page.goto('/recipes');
    await page.getByTestId('import-recipe-btn').click();
    await page.getByTestId('import-url-input').fill('https://www.recipetineats.com/honey-garlic-chicken/');
    await page.getByTestId('fetch-recipe-btn').click();

    await expect(page.getByTestId('preview-recipe-page')).toBeVisible();

    // Check title is populated
    const titleInput = page.getByTestId('title-input');
    await expect(titleInput).toHaveValue('Honey Garlic Chicken');

    // Check ingredients are listed
    await expect(page.getByText('chicken thighs')).toBeVisible();
    await expect(page.getByText('honey')).toBeVisible();
    await expect(page.getByText('garlic')).toBeVisible();
  });

  test('Can select meal type for imported recipe', async ({ page }) => {
    await page.goto('/recipes');
    await page.getByTestId('import-recipe-btn').click();
    await page.getByTestId('import-url-input').fill('https://www.recipetineats.com/honey-garlic-chicken/');
    await page.getByTestId('fetch-recipe-btn').click();

    await expect(page.getByTestId('preview-recipe-page')).toBeVisible();

    const mealTypeSelect = page.getByTestId('meal-type-select');
    await expect(mealTypeSelect).toBeVisible();

    // Change meal type
    await mealTypeSelect.selectOption('lunch');
    await expect(mealTypeSelect).toHaveValue('lunch');
  });

  test('Can adjust ingredient categories before saving', async ({ page }) => {
    await page.goto('/recipes');
    await page.getByTestId('import-recipe-btn').click();
    await page.getByTestId('import-url-input').fill('https://www.recipetineats.com/honey-garlic-chicken/');
    await page.getByTestId('fetch-recipe-btn').click();

    await expect(page.getByTestId('preview-recipe-page')).toBeVisible();

    // Find a category dropdown and change it
    const categorySelects = page.locator('select').filter({ hasText: /produce|dairy|meat|pantry|frozen|uncategorized/i });
    const firstSelect = categorySelects.first();
    await expect(firstSelect).toBeVisible();

    // Change category
    await firstSelect.selectOption('meat');
  });

  test('Saved recipes appear in "My Recipes" list', async ({ page }) => {
    await page.goto('/recipes');
    await page.getByTestId('import-recipe-btn').click();
    await page.getByTestId('import-url-input').fill('https://www.recipetineats.com/honey-garlic-chicken/');
    await page.getByTestId('fetch-recipe-btn').click();

    await expect(page.getByTestId('preview-recipe-page')).toBeVisible();
    await page.getByTestId('save-recipe-btn').click();

    // Should redirect to recipes list
    await expect(page).toHaveURL('/recipes');

    // Recipe should appear in the list
    await expect(page.getByText('Honey Garlic Chicken')).toBeVisible();
    await expect(page.getByText('from Recipetineats')).toBeVisible();
  });

  test('Imported recipes link to original website for cooking instructions', async ({ page }) => {
    // First import a recipe
    await page.goto('/recipes');
    await page.getByTestId('import-recipe-btn').click();
    await page.getByTestId('import-url-input').fill('https://www.recipetineats.com/honey-garlic-chicken/');
    await page.getByTestId('fetch-recipe-btn').click();
    await page.getByTestId('save-recipe-btn').click();

    // Navigate to the recipe detail
    await page.getByText('Honey Garlic Chicken').click();

    // Should show link to original website
    const viewRecipeLink = page.getByTestId('view-recipe-link');
    await expect(viewRecipeLink).toBeVisible();
    await expect(viewRecipeLink).toContainText('View Recipe on Recipetineats');
    await expect(viewRecipeLink).toHaveAttribute('href', 'https://www.recipetineats.com/honey-garlic-chicken/');

    // Should show explanatory text
    await expect(page.getByText('Cooking instructions are on the original website')).toBeVisible();
  });

  test('Imported recipe ingredients appear on shopping list when used in a plan', async ({ page }) => {
    // First import a recipe as dinner
    await page.goto('/recipes');
    await page.getByTestId('import-recipe-btn').click();
    await page.getByTestId('import-url-input').fill('https://www.recipetineats.com/honey-garlic-chicken/');
    await page.getByTestId('fetch-recipe-btn').click();
    await page.getByTestId('meal-type-select').selectOption('dinner');
    await page.getByTestId('save-recipe-btn').click();

    // Retrieve the saved user recipe ID from localStorage
    const recipeId = await page.evaluate(() => {
      const stored = localStorage.getItem('food-plan-storage');
      if (!stored) return null;
      const state = JSON.parse(stored);
      const recipes = state.state.userRecipes ?? [];
      return recipes.length > 0 ? recipes[0].id : null;
    });
    expect(recipeId).not.toBeNull();

    // Create an empty plan via the UI
    await page.goto('/plan');
    await page.getByTestId('generate-plan-btn').click();
    await page.waitForURL('/plan/current');

    // Inject the user recipe into the plan's meals directly via localStorage
    await page.evaluate((rid) => {
      const stored = localStorage.getItem('food-plan-storage');
      if (!stored) return;
      const state = JSON.parse(stored);
      state.state.currentPlan.meals.push({
        id: `meal-injected-${Date.now()}`,
        dayIndex: 0,
        mealType: 'dinner',
        recipeId: rid,
        servings: 4,
      });
      localStorage.setItem('food-plan-storage', JSON.stringify(state));
    }, recipeId);

    // Navigate to shopping list (reload so Zustand picks up the updated state)
    await page.goto('/shopping-list');
    await expect(page.getByTestId('shopping-list')).toBeVisible();

    // The imported recipe ingredients should appear on the shopping list
    // (ingredient names are capitalized by the parser, e.g. "Chicken thighs")
    await expect(page.getByText('Chicken thighs')).toBeVisible();
    await expect(page.getByText('Honey')).toBeVisible();
  });

  test('Shows empty state when no recipes imported', async ({ page }) => {
    await page.goto('/recipes');

    await expect(page.getByTestId('empty-recipes')).toBeVisible();
    await expect(page.getByText('No recipes yet')).toBeVisible();
  });

  test('Can delete an imported recipe', async ({ page }) => {
    // First import a recipe
    await page.goto('/recipes');
    await page.getByTestId('import-recipe-btn').click();
    await page.getByTestId('import-url-input').fill('https://www.recipetineats.com/honey-garlic-chicken/');
    await page.getByTestId('fetch-recipe-btn').click();
    await page.getByTestId('save-recipe-btn').click();

    // Navigate to the recipe detail
    await page.getByText('Honey Garlic Chicken').click();

    // Delete the recipe — opens confirmation drawer
    await page.getByTestId('delete-recipe-btn').click();

    // Confirm deletion in the drawer
    await page.getByTestId('confirm-delete-btn').click();

    // Should redirect to recipes list
    await expect(page).toHaveURL('/recipes');

    // Recipe should no longer appear
    await expect(page.getByText('Honey Garlic Chicken')).not.toBeVisible();
  });
});
