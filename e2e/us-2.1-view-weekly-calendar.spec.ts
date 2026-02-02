import { test, expect } from '@playwright/test';
import { clearAppState, createDefaultPlan } from './helpers/test-utils';

/**
 * US-2.1: View weekly calendar
 *
 * As a family meal planner
 * I want to see my meal plan displayed as a weekly calendar
 * So that I can see at a glance what we're eating each day
 *
 * Acceptance Criteria:
 * - [ ] Shows 7 days in a grid/list layout
 * - [ ] Each day shows assigned meals (breakfast, lunch, dinner)
 * - [ ] Each meal displays the recipe name
 * - [ ] Shows prep time for each meal
 * - [ ] Works on mobile (responsive layout)
 */

test.describe('US-2.1: View weekly calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createDefaultPlan(page);
  });

  test('Shows 7 days in a grid/list layout', async ({ page }) => {
    for (let i = 0; i < 7; i++) {
      await expect(page.getByTestId(`day-${i}`)).toBeVisible();
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const day of days) {
      await expect(page.getByText(day)).toBeVisible();
    }
  });

  test('Each day shows assigned meals (breakfast, lunch, dinner)', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await expect(firstDay.locator('text=BREAKFAST').first()).toBeVisible();
    await expect(firstDay.locator('text=LUNCH').first()).toBeVisible();
    await expect(firstDay.locator('text=DINNER').first()).toBeVisible();
  });

  test('Each meal displays the recipe name', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const meals = firstDay.locator('[data-testid^="meal-"]');
    const count = await meals.count();
    expect(count).toBeGreaterThan(0);

    // Each meal has a link with the recipe name
    const firstMeal = meals.first();
    await expect(firstMeal.locator('a')).toBeVisible();
  });

  test('Shows prep time for each meal', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await expect(firstDay.getByText(/\d+ mins/).first()).toBeVisible();
  });

  test('Works on mobile (responsive layout)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('meal-plan')).toBeVisible();
    await expect(page.getByTestId('day-0')).toBeVisible();
  });

  test('Respects numberOfDays preference', async ({ page }) => {
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
});
