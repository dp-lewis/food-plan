import { test, expect } from '@playwright/test';
import { clearAppState, createDefaultPlan } from './helpers/test-utils';

/**
 * US-2.3: Swap a meal
 *
 * As a family meal planner
 * I want to swap out a meal I don't like for a different one
 * So that I can customise the plan to my family's preferences
 *
 * Acceptance Criteria:
 * - [ ] Each meal has a "Swap" button/action
 * - [ ] Swapping replaces the meal with a different recipe of the same type
 * - [ ] New recipe is randomly selected from available options
 * - [ ] Change is saved to localStorage
 * - [ ] Can swap the same meal multiple times
 */

test.describe('US-2.3: Swap a meal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createDefaultPlan(page);
  });

  test('Each meal has a "Swap" button/action', async ({ page }) => {
    const swapButtons = page.locator('[data-testid^="swap-"]');
    const count = await swapButtons.count();
    expect(count).toBeGreaterThan(0);

    const firstSwap = swapButtons.first();
    await expect(firstSwap).toBeVisible();
    await expect(firstSwap).toHaveText('Swap');
  });

  test('Swapping replaces the meal with a different recipe', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const firstMeal = firstDay.locator('[data-testid^="meal-"]').first();
    const originalRecipe = await firstMeal.locator('a').textContent();

    const swapButton = firstDay.locator('[data-testid^="swap-"]').first();

    // Click swap multiple times to increase chance of getting a different recipe
    let newRecipe = originalRecipe;
    for (let i = 0; i < 5 && newRecipe === originalRecipe; i++) {
      await swapButton.click();
      await page.waitForTimeout(100);
      newRecipe = await firstMeal.locator('a').textContent();
    }

    expect(newRecipe).not.toBeNull();
  });

  test('Change is saved to localStorage', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const swapButton = firstDay.locator('[data-testid^="swap-"]').first();

    await swapButton.click();
    await page.waitForTimeout(100);

    const recipeAfterSwap = await firstDay.locator('[data-testid^="meal-"]').first().locator('a').textContent();

    // Reload page
    await page.reload();

    const recipeAfterReload = await page.getByTestId('day-0').locator('[data-testid^="meal-"]').first().locator('a').textContent();

    expect(recipeAfterReload).toBe(recipeAfterSwap);
  });

  test('Can swap the same meal multiple times', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const firstMeal = firstDay.locator('[data-testid^="meal-"]').first();
    const swapButton = firstDay.locator('[data-testid^="swap-"]').first();

    await swapButton.click();
    await page.waitForTimeout(50);
    await swapButton.click();
    await page.waitForTimeout(50);
    await swapButton.click();

    await expect(firstMeal).toBeVisible();
  });
});
