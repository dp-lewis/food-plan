import { test, expect } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

test.describe('US-1.1: Create a new meal plan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await page.goto('/plan');
  });

  test('form has correct defaults (4 people, 7 days, all meals, medium budget)', async ({ page }) => {
    // Number of people defaults to 4
    await expect(page.getByTestId('people-count')).toHaveText('4');

    // 7 days selected (active state)
    await expect(page.getByTestId('day-7')).toHaveClass(/day-button-active/);

    // All meal types selected
    await expect(page.getByTestId('meal-breakfast')).toHaveClass(/meal-button-active/);
    await expect(page.getByTestId('meal-lunch')).toHaveClass(/meal-button-active/);
    await expect(page.getByTestId('meal-dinner')).toHaveClass(/meal-button-active/);

    // Medium budget selected
    await expect(page.getByTestId('budget-medium')).toHaveClass(/budget-button-active/);
  });

  test('can change number of people', async ({ page }) => {
    // Decrement
    await page.getByTestId('people-decrement').click();
    await expect(page.getByTestId('people-count')).toHaveText('3');

    // Increment
    await page.getByTestId('people-increment').click();
    await page.getByTestId('people-increment').click();
    await expect(page.getByTestId('people-count')).toHaveText('5');
  });

  test('can change number of days', async ({ page }) => {
    await page.getByTestId('day-3').click();
    await expect(page.getByTestId('day-3')).toHaveClass(/day-button-active/);
    await expect(page.getByTestId('day-7')).not.toHaveClass(/day-button-active/);
  });

  test('can toggle meal types', async ({ page }) => {
    // Toggle off breakfast
    await page.getByTestId('meal-breakfast').click();
    await expect(page.getByTestId('meal-breakfast')).not.toHaveClass(/meal-button-active/);

    // Toggle it back on
    await page.getByTestId('meal-breakfast').click();
    await expect(page.getByTestId('meal-breakfast')).toHaveClass(/meal-button-active/);
  });

  test('can change budget level', async ({ page }) => {
    await page.getByTestId('budget-low').click();
    await expect(page.getByTestId('budget-low')).toHaveClass(/budget-button-active/);
    await expect(page.getByTestId('budget-medium')).not.toHaveClass(/budget-button-active/);

    await page.getByTestId('budget-high').click();
    await expect(page.getByTestId('budget-high')).toHaveClass(/budget-button-active/);
  });

  test('clicking "Generate Plan" creates plan and redirects to /plan/current', async ({ page }) => {
    await page.getByTestId('generate-plan-btn').click();
    await expect(page).toHaveURL('/plan/current');
    await expect(page.getByTestId('meal-plan')).toBeVisible();
  });

  test('plan is saved to localStorage', async ({ page }) => {
    await page.getByTestId('generate-plan-btn').click();
    await page.waitForURL('/plan/current');

    // Check localStorage
    const storage = await page.evaluate(() => localStorage.getItem('food-plan-storage'));
    expect(storage).not.toBeNull();

    const parsed = JSON.parse(storage!);
    expect(parsed.state.currentPlan).not.toBeNull();
    expect(parsed.state.currentPlan.meals.length).toBeGreaterThan(0);
  });
});
