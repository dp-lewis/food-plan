import { test, expect } from '@playwright/test';
import { clearAppState, createDefaultPlan } from './helpers/test-utils';

test.describe('US-3.1: View recipe details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createDefaultPlan(page);
  });

  test('can navigate to recipe from plan view', async ({ page }) => {
    // Click on first recipe link (within first day)
    const firstDay = page.getByTestId('day-0');
    const firstRecipeLink = firstDay.locator('[data-testid^="meal-"]').first().locator('a');
    await firstRecipeLink.click();

    await expect(page.getByTestId('recipe-page')).toBeVisible();
  });

  test('shows recipe title', async ({ page }) => {
    // Navigate to a recipe
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    const title = page.getByTestId('recipe-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText!.length).toBeGreaterThan(0);
  });

  test('shows prep time and cook time (as total time)', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    const timeElement = page.getByTestId('recipe-time');
    await expect(timeElement).toBeVisible();
    await expect(timeElement).toContainText('mins');
  });

  test('shows number of servings', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    const servingsElement = page.getByTestId('recipe-servings');
    await expect(servingsElement).toBeVisible();
    await expect(servingsElement).toContainText('Servings');
  });

  test('shows difficulty level', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    // Difficulty is shown in a meta box with label
    const difficultyLabel = page.getByText('Difficulty');
    await expect(difficultyLabel).toBeVisible();
  });

  test('shows list of ingredients with quantities', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    const ingredientsList = page.getByTestId('ingredients-list');
    await expect(ingredientsList).toBeVisible();

    // Should have at least one ingredient
    const items = ingredientsList.locator('li');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('shows step-by-step instructions', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    const instructionsList = page.getByTestId('instructions-list');
    await expect(instructionsList).toBeVisible();

    // Should have at least one step
    const steps = instructionsList.locator('li');
    const count = await steps.count();
    expect(count).toBeGreaterThan(0);
  });

  test('shows estimated cost level', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    // Cost is shown in a meta box with label
    const costLabel = page.getByText('Cost');
    await expect(costLabel).toBeVisible();
  });

  test('back navigation works', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();
    await expect(page.getByTestId('recipe-page')).toBeVisible();

    // Click back button
    await page.getByText('← Back').click();

    // Should be back on plan page
    await expect(page.getByTestId('meal-plan')).toBeVisible();
  });
});
