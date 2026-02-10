import { test, expect } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

/**
 * US-7.2: Create recipe manually
 *
 * As a family meal planner
 * I want to add simple recipes manually without needing a URL
 * So that I can include our family staples like "Schnitzel and salad" in meal plans
 *
 * Acceptance Criteria:
 * - [ ] Can navigate to manual recipe form from My Recipes
 * - [ ] Can enter a recipe title
 * - [ ] Can select meal type (breakfast, lunch, dinner)
 * - [ ] Can add multiple ingredients with quantities
 * - [ ] Can set ingredient categories for shopping list grouping
 * - [ ] Can add optional notes (brief reminders)
 * - [ ] Saved recipe appears in My Recipes list as "Your recipe"
 * - [ ] Manual recipe ingredients appear on shopping list when used in a plan
 */

test.describe('US-7.2: Create recipe manually', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  test('Can navigate to manual recipe form from My Recipes', async ({ page }) => {
    await page.goto('/recipes');
    await page.getByTestId('create-recipe-btn').click();
    await expect(page).toHaveURL('/recipes/new');
    await expect(page.getByTestId('new-recipe-page')).toBeVisible();
  });

  test('Can enter a recipe title', async ({ page }) => {
    await page.goto('/recipes/new');

    const titleInput = page.getByTestId('title-input');
    await expect(titleInput).toBeVisible();

    await titleInput.fill('Schnitzel and salad');
    await expect(titleInput).toHaveValue('Schnitzel and salad');
  });

  test('Can select meal type', async ({ page }) => {
    await page.goto('/recipes/new');

    const mealTypeSelect = page.getByTestId('meal-type-select');
    await expect(mealTypeSelect).toBeVisible();

    // Default is dinner
    await expect(mealTypeSelect).toHaveValue('dinner');

    // Can change to lunch
    await mealTypeSelect.selectOption('lunch');
    await expect(mealTypeSelect).toHaveValue('lunch');

    // Can change to breakfast
    await mealTypeSelect.selectOption('breakfast');
    await expect(mealTypeSelect).toHaveValue('breakfast');
  });

  test('Can add multiple ingredients with quantities', async ({ page }) => {
    await page.goto('/recipes/new');

    const ingredientInput = page.getByTestId('new-ingredient-input');
    const addButton = page.getByTestId('add-ingredient-btn');

    // Add first ingredient
    await ingredientInput.fill('2 chicken schnitzels');
    await addButton.click();

    // Add second ingredient
    await ingredientInput.fill('1 bag mixed salad');
    await addButton.click();

    // Add third ingredient using Enter key
    await ingredientInput.fill('1 lemon');
    await ingredientInput.press('Enter');

    // Verify all ingredients are listed
    await expect(page.getByTestId('ingredients-list')).toBeVisible();
    await expect(page.getByTestId('ingredient-0')).toBeVisible();
    await expect(page.getByTestId('ingredient-1')).toBeVisible();
    await expect(page.getByTestId('ingredient-2')).toBeVisible();
  });

  test('Can set ingredient categories', async ({ page }) => {
    await page.goto('/recipes/new');

    // Add an ingredient
    await page.getByTestId('new-ingredient-input').fill('2 chicken schnitzels');
    await page.getByTestId('add-ingredient-btn').click();

    // Change category
    const categorySelect = page.getByTestId('category-0');
    await expect(categorySelect).toBeVisible();

    await categorySelect.selectOption('meat');
    await expect(categorySelect).toHaveValue('meat');
  });

  test('Can remove ingredients', async ({ page }) => {
    await page.goto('/recipes/new');

    // Add two ingredients
    await page.getByTestId('new-ingredient-input').fill('2 chicken schnitzels');
    await page.getByTestId('add-ingredient-btn').click();
    await page.getByTestId('new-ingredient-input').fill('1 lemon');
    await page.getByTestId('add-ingredient-btn').click();

    // Verify both exist
    await expect(page.getByTestId('ingredient-0')).toBeVisible();
    await expect(page.getByTestId('ingredient-1')).toBeVisible();

    // Remove first ingredient
    await page.getByTestId('remove-ingredient-0').click();

    // Now only one ingredient should remain
    await expect(page.getByTestId('ingredient-0')).toBeVisible();
    await expect(page.getByTestId('ingredient-1')).not.toBeVisible();
  });

  test('Can add optional notes', async ({ page }) => {
    await page.goto('/recipes/new');

    const notesInput = page.getByTestId('notes-input');
    await expect(notesInput).toBeVisible();

    await notesInput.fill('Use the good breadcrumbs from the freezer');
    await expect(notesInput).toHaveValue('Use the good breadcrumbs from the freezer');
  });

  test('Title and at least one ingredient are required to save', async ({ page }) => {
    await page.goto('/recipes/new');

    const saveButton = page.getByTestId('save-recipe-btn');

    // Initially disabled (no title, no ingredients)
    await expect(saveButton).toBeDisabled();

    // Add title only - still disabled
    await page.getByTestId('title-input').fill('Test Recipe');
    await expect(saveButton).toBeDisabled();

    // Clear title, add ingredient only - still disabled
    await page.getByTestId('title-input').clear();
    await page.getByTestId('new-ingredient-input').fill('1 item');
    await page.getByTestId('add-ingredient-btn').click();
    await expect(saveButton).toBeDisabled();

    // Add title back - now enabled
    await page.getByTestId('title-input').fill('Test Recipe');
    await expect(saveButton).toBeEnabled();
  });

  test('Saved recipe appears in My Recipes list as "Your recipe"', async ({ page }) => {
    await page.goto('/recipes/new');

    // Fill in recipe
    await page.getByTestId('title-input').fill('Schnitzel and salad');
    await page.getByTestId('meal-type-select').selectOption('dinner');
    await page.getByTestId('new-ingredient-input').fill('2 chicken schnitzels');
    await page.getByTestId('add-ingredient-btn').click();

    // Save
    await page.getByTestId('save-recipe-btn').click();

    // Should redirect to recipes list
    await expect(page).toHaveURL('/recipes');

    // Recipe should appear with "Your recipe" label
    await expect(page.getByText('Schnitzel and salad')).toBeVisible();
    await expect(page.getByText('Your recipe')).toBeVisible();
  });

  test('Recipe notes are displayed on detail page', async ({ page }) => {
    await page.goto('/recipes/new');

    // Create recipe with notes
    await page.getByTestId('title-input').fill('Test with notes');
    await page.getByTestId('new-ingredient-input').fill('1 item');
    await page.getByTestId('add-ingredient-btn').click();
    await page.getByTestId('notes-input').fill('Remember to preheat the oven');
    await page.getByTestId('save-recipe-btn').click();

    // Navigate to recipe detail
    await page.getByText('Test with notes').click();

    // Notes should be visible
    await expect(page.getByTestId('recipe-notes')).toBeVisible();
    await expect(page.getByText('Remember to preheat the oven')).toBeVisible();
  });

  test('Manual recipes show "Your recipe" not source attribution', async ({ page }) => {
    await page.goto('/recipes/new');

    // Create recipe
    await page.getByTestId('title-input').fill('My family recipe');
    await page.getByTestId('new-ingredient-input').fill('1 item');
    await page.getByTestId('add-ingredient-btn').click();
    await page.getByTestId('save-recipe-btn').click();

    // Navigate to recipe detail
    await page.getByText('My family recipe').click();

    // Should show "Your recipe" not any source
    await expect(page.getByTestId('recipe-source')).toContainText('Your recipe');
    await expect(page.getByTestId('view-recipe-link')).not.toBeVisible();
  });

  test('Manual recipe ingredients appear on shopping list', async ({ page }) => {
    // First create a manual recipe
    await page.goto('/recipes/new');
    await page.getByTestId('title-input').fill('Quick dinner');
    await page.getByTestId('meal-type-select').selectOption('dinner');
    await page.getByTestId('new-ingredient-input').fill('500g beef mince');
    await page.getByTestId('add-ingredient-btn').click();
    await page.getByTestId('new-ingredient-input').fill('1 onion');
    await page.getByTestId('add-ingredient-btn').click();
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

    // The manual recipe ingredients should appear on the shopping list
    // (ingredient names are capitalized by the parser, e.g. "Beef mince")
    await expect(page.getByText('Beef mince')).toBeVisible();
    await expect(page.getByText('Onion')).toBeVisible();
  });

  test('Empty state shows both create and import options', async ({ page }) => {
    await page.goto('/recipes');

    await expect(page.getByTestId('empty-recipes')).toBeVisible();
    await expect(page.getByTestId('empty-create-btn')).toBeVisible();
    await expect(page.getByTestId('empty-import-btn')).toBeVisible();
  });
});
