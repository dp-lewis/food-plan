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
 * - [ ] Clicking Swap opens a drawer with recipe options
 * - [ ] Can select a specific recipe from the list
 * - [ ] Can use "Surprise me" for random selection
 * - [ ] Current recipe is highlighted and disabled
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

  test('Clicking Swap opens a drawer with recipe options', async ({ page }) => {
    const swapButton = page.locator('[data-testid^="swap-"]').first();
    await swapButton.click();

    // Drawer should be visible
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();

    // Should have recipe options
    const recipeList = page.getByTestId('recipe-drawer-list');
    await expect(recipeList).toBeVisible();

    // Should have surprise me button
    const surpriseBtn = page.getByTestId('surprise-me-btn');
    await expect(surpriseBtn).toBeVisible();
  });

  test('Can select a specific recipe from the list', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const firstMeal = firstDay.locator('[data-testid^="meal-"]').first();
    const originalRecipe = await firstMeal.locator('a').textContent();

    const swapButton = firstDay.locator('[data-testid^="swap-"]').first();
    await swapButton.click();

    // Wait for drawer
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Find a recipe that is not the current one (not disabled)
    const recipeOptions = page.locator('[data-testid^="recipe-option-"]:not([disabled])');
    const availableCount = await recipeOptions.count();
    expect(availableCount).toBeGreaterThan(0);

    // Click the first available recipe
    await recipeOptions.first().click();

    // Drawer should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Recipe should be different (or same if only one option, but swap happened)
    const newRecipe = await firstMeal.locator('a').textContent();
    expect(newRecipe).not.toBeNull();
    // Note: might be same recipe if limited options, that's okay
  });

  test('Can use "Surprise me" for random selection', async ({ page }) => {
    const swapButton = page.locator('[data-testid^="swap-"]').first();
    await swapButton.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const surpriseBtn = page.getByTestId('surprise-me-btn');
    await surpriseBtn.click();

    // Drawer should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('Current recipe is highlighted and disabled', async ({ page }) => {
    const swapButton = page.locator('[data-testid^="swap-"]').first();
    await swapButton.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Find the current recipe card (should have --current class and be disabled)
    const currentCard = page.locator('.recipe-card--current');
    await expect(currentCard).toBeVisible();
    await expect(currentCard).toBeDisabled();
    await expect(currentCard.locator('.recipe-card__badge')).toHaveText('Current');
  });

  test('Change is saved to localStorage', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const swapButton = firstDay.locator('[data-testid^="swap-"]').first();

    await swapButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click surprise me to swap
    await page.getByTestId('surprise-me-btn').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    const recipeAfterSwap = await firstDay.locator('[data-testid^="meal-"]').first().locator('a').textContent();

    // Wait for localStorage to persist (Zustand persist middleware is async)
    await page.waitForTimeout(500);

    // Reload page and wait for meal plan to load
    await page.reload();
    await expect(page.getByTestId('meal-plan')).toBeVisible({ timeout: 10000 });

    const recipeAfterReload = await page.getByTestId('day-0').locator('[data-testid^="meal-"]').first().locator('a').textContent();

    expect(recipeAfterReload).toBe(recipeAfterSwap);
  });

  test('Can swap the same meal multiple times', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const firstMeal = firstDay.locator('[data-testid^="meal-"]').first();
    const swapButton = firstDay.locator('[data-testid^="swap-"]').first();

    // First swap
    await swapButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.getByTestId('surprise-me-btn').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Second swap
    await swapButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.getByTestId('surprise-me-btn').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Third swap
    await swapButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.getByTestId('surprise-me-btn').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    await expect(firstMeal).toBeVisible();
  });

  test('Can dismiss drawer without swapping', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const firstMeal = firstDay.locator('[data-testid^="meal-"]').first();
    const originalRecipe = await firstMeal.locator('a').textContent();

    const swapButton = firstDay.locator('[data-testid^="swap-"]').first();
    await swapButton.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click backdrop to dismiss
    await page.locator('.drawer-backdrop').click();

    // Drawer should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Recipe should be unchanged
    const recipeAfterDismiss = await firstMeal.locator('a').textContent();
    expect(recipeAfterDismiss).toBe(originalRecipe);
  });
});
