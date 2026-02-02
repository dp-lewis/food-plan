import { test, expect } from '@playwright/test';
import { clearAppState, createDefaultPlan } from './helpers/test-utils';

test.describe('US-2.1: View weekly calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createDefaultPlan(page);
  });

  test('shows 7 days in a list layout', async ({ page }) => {
    // Check all 7 days are visible
    for (let i = 0; i < 7; i++) {
      await expect(page.getByTestId(`day-${i}`)).toBeVisible();
    }
  });

  test('each day shows day name', async ({ page }) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days) {
      await expect(page.getByText(day)).toBeVisible();
    }
  });

  test('each day shows assigned meals (breakfast, lunch, dinner)', async ({ page }) => {
    // Check first day has all three meal types by looking at meal type labels
    const firstDay = page.getByTestId('day-0');
    await expect(firstDay.locator('text=BREAKFAST').first()).toBeVisible();
    await expect(firstDay.locator('text=LUNCH').first()).toBeVisible();
    await expect(firstDay.locator('text=DINNER').first()).toBeVisible();
  });

  test('each meal displays the recipe name', async ({ page }) => {
    // Get meal elements (exclude meal-plan container)
    const firstDay = page.getByTestId('day-0');
    const meals = firstDay.locator('[data-testid^="meal-"]');
    const count = await meals.count();
    expect(count).toBeGreaterThan(0);

    // Check first meal has a link (recipe name is a link)
    const firstMeal = meals.first();
    await expect(firstMeal.locator('a')).toBeVisible();
  });

  test('shows prep time for each meal', async ({ page }) => {
    // Check that at least one meal shows time in "X mins" format
    const firstDay = page.getByTestId('day-0');
    await expect(firstDay.getByText(/\d+ mins/).first()).toBeVisible();
  });

  test('respects numberOfDays preference', async ({ page }) => {
    // Create a 3-day plan
    await clearAppState(page);
    await page.goto('/plan');
    await page.getByTestId('day-3').click();
    await page.getByTestId('generate-plan-btn').click();
    await page.waitForURL('/plan/current');

    // Should show 3 days
    await expect(page.getByTestId('day-0')).toBeVisible();
    await expect(page.getByTestId('day-1')).toBeVisible();
    await expect(page.getByTestId('day-2')).toBeVisible();

    // Should NOT show days 3-6
    await expect(page.getByTestId('day-3')).not.toBeVisible();
  });

  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('meal-plan')).toBeVisible();
    await expect(page.getByTestId('day-0')).toBeVisible();
  });
});
