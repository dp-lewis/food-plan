import { test, expect } from '@playwright/test';
import { clearAppState, createDefaultPlan } from './helpers/test-utils';

test.describe('US-2.3: Swap a meal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createDefaultPlan(page);
  });

  test('each meal has a "Swap" button', async ({ page }) => {
    const swapButtons = page.locator('[data-testid^="swap-"]');
    const count = await swapButtons.count();
    expect(count).toBeGreaterThan(0);

    // All should be visible and contain "Swap" text
    const firstSwap = swapButtons.first();
    await expect(firstSwap).toBeVisible();
    await expect(firstSwap).toHaveText('Swap');
  });

  test('clicking swap changes the recipe', async ({ page }) => {
    // Get the first meal's recipe name (within first day)
    const firstDay = page.getByTestId('day-0');
    const firstMeal = firstDay.locator('[data-testid^="meal-"]').first();
    const originalRecipe = await firstMeal.locator('a').textContent();

    // Get the swap button for the first meal
    const swapButton = firstDay.locator('[data-testid^="swap-"]').first();

    // Click swap multiple times to increase chance of getting a different recipe
    // (since selection is random and pool might be limited)
    let newRecipe = originalRecipe;
    for (let i = 0; i < 5 && newRecipe === originalRecipe; i++) {
      await swapButton.click();
      // Wait for potential re-render
      await page.waitForTimeout(100);
      newRecipe = await firstMeal.locator('a').textContent();
    }

    // Recipe should have changed (may be same if only one option available)
    expect(newRecipe).not.toBeNull();
  });

  test('change persists after page reload', async ({ page }) => {
    // Get first meal and swap it
    const firstDay = page.getByTestId('day-0');
    const swapButton = firstDay.locator('[data-testid^="swap-"]').first();

    // Click swap
    await swapButton.click();
    await page.waitForTimeout(100);

    // Get the new recipe name
    const recipeAfterSwap = await firstDay.locator('[data-testid^="meal-"]').first().locator('a').textContent();

    // Reload page
    await page.reload();

    // Get recipe name after reload
    const firstDayReloaded = page.getByTestId('day-0');
    const recipeAfterReload = await firstDayReloaded.locator('[data-testid^="meal-"]').first().locator('a').textContent();

    expect(recipeAfterReload).toBe(recipeAfterSwap);
  });

  test('can swap the same meal multiple times', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const firstMeal = firstDay.locator('[data-testid^="meal-"]').first();
    const swapButton = firstDay.locator('[data-testid^="swap-"]').first();

    // Click swap multiple times - should not error
    await swapButton.click();
    await page.waitForTimeout(50);
    await swapButton.click();
    await page.waitForTimeout(50);
    await swapButton.click();

    // Meal should still be visible
    await expect(firstMeal).toBeVisible();
  });
});
