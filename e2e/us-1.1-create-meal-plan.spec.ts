import { test, expect } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

/**
 * US-1.1: Create a new meal plan
 *
 * As a family meal planner
 * I want to generate a weekly meal plan based on my preferences
 * So that I don't have to decide what to cook each day
 *
 * Acceptance Criteria:
 * - [ ] Can specify number of people (default: 4)
 * - [ ] Can specify number of days (1-7, default: 7)
 * - [ ] Can select which meals to plan (breakfast, lunch, dinner)
 * - [ ] Can select budget level (low, medium, high)
 * - [ ] Clicking "Generate Plan" creates a plan from available recipes
 * - [ ] Plan is saved to localStorage
 * - [ ] Redirects to plan view after generation
 */

test.describe('US-1.1: Create a new meal plan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await page.goto('/plan');
  });

  test('Can specify number of people (default: 4)', async ({ page }) => {
    // Verify default
    await expect(page.getByTestId('people-count')).toHaveText('4');

    // Can change it
    await page.getByTestId('people-decrement').click();
    await expect(page.getByTestId('people-count')).toHaveText('3');

    await page.getByTestId('people-increment').click();
    await page.getByTestId('people-increment').click();
    await expect(page.getByTestId('people-count')).toHaveText('5');
  });

  test('Can specify number of days (1-7, default: 7)', async ({ page }) => {
    // Verify default
    await expect(page.getByTestId('day-7')).toHaveClass(/day-button-active/);

    // Can change it
    await page.getByTestId('day-3').click();
    await expect(page.getByTestId('day-3')).toHaveClass(/day-button-active/);
    await expect(page.getByTestId('day-7')).not.toHaveClass(/day-button-active/);
  });

  test('Can select which meals to plan (breakfast, lunch, dinner)', async ({ page }) => {
    // All selected by default
    await expect(page.getByTestId('meal-breakfast')).toHaveClass(/meal-button-active/);
    await expect(page.getByTestId('meal-lunch')).toHaveClass(/meal-button-active/);
    await expect(page.getByTestId('meal-dinner')).toHaveClass(/meal-button-active/);

    // Can toggle off
    await page.getByTestId('meal-breakfast').click();
    await expect(page.getByTestId('meal-breakfast')).not.toHaveClass(/meal-button-active/);

    // Can toggle back on
    await page.getByTestId('meal-breakfast').click();
    await expect(page.getByTestId('meal-breakfast')).toHaveClass(/meal-button-active/);
  });

  test('Can select budget level (low, medium, high)', async ({ page }) => {
    // Medium selected by default
    await expect(page.getByTestId('budget-medium')).toHaveClass(/budget-button-active/);

    // Can change to low
    await page.getByTestId('budget-low').click();
    await expect(page.getByTestId('budget-low')).toHaveClass(/budget-button-active/);
    await expect(page.getByTestId('budget-medium')).not.toHaveClass(/budget-button-active/);

    // Can change to high
    await page.getByTestId('budget-high').click();
    await expect(page.getByTestId('budget-high')).toHaveClass(/budget-button-active/);
  });

  test('Clicking "Generate Plan" creates a plan from available recipes', async ({ page }) => {
    await page.getByTestId('generate-plan-btn').click();
    await page.waitForURL('/plan/current');

    // Plan should have meals
    const meals = page.locator('[data-testid^="meal-"]:not([data-testid="meal-plan"])');
    const count = await meals.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Plan is saved to localStorage', async ({ page }) => {
    await page.getByTestId('generate-plan-btn').click();
    await page.waitForURL('/plan/current');

    const storage = await page.evaluate(() => localStorage.getItem('food-plan-storage'));
    expect(storage).not.toBeNull();

    const parsed = JSON.parse(storage!);
    expect(parsed.state.currentPlan).not.toBeNull();
    expect(parsed.state.currentPlan.meals.length).toBeGreaterThan(0);
  });

  test('Redirects to plan view after generation', async ({ page }) => {
    await page.getByTestId('generate-plan-btn').click();
    await expect(page).toHaveURL('/plan/current');
    await expect(page.getByTestId('meal-plan')).toBeVisible();
  });
});
