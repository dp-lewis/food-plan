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
 * - [ ] Can specify number of days (1-7, default: 7)
 * - [ ] Can select which meals to plan (breakfast, lunch, dinner)
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

  test('Can specify number of days (1-7, default: 7)', async ({ page }) => {
    // Verify default
    await expect(page.getByTestId('day-7')).toHaveAttribute('aria-pressed', 'true');

    // Can change it
    await page.getByTestId('day-3').click();
    await expect(page.getByTestId('day-3')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('day-7')).toHaveAttribute('aria-pressed', 'false');
  });

  test('Can select which meals to plan (breakfast, lunch, dinner)', async ({ page }) => {
    // All selected by default
    await expect(page.getByTestId('meal-breakfast')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('meal-lunch')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('meal-dinner')).toHaveAttribute('aria-pressed', 'true');

    // Can toggle off
    await page.getByTestId('meal-breakfast').click();
    await expect(page.getByTestId('meal-breakfast')).toHaveAttribute('aria-pressed', 'false');

    // Can toggle back on
    await page.getByTestId('meal-breakfast').click();
    await expect(page.getByTestId('meal-breakfast')).toHaveAttribute('aria-pressed', 'true');
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
