import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-2.1: View weekly calendar
 *
 * As a family meal planner
 * I want to see my meal plan displayed as a weekly calendar
 * So that I can see at a glance what we're eating each day
 *
 * Acceptance Criteria:
 * - [ ] Shows 7 days in a grid/list layout
 * - [ ] Each day shows 3 meal slots (breakfast, lunch, dinner)
 * - [ ] Each meal displays the recipe name
 * - [ ] Shows prep time for each meal
 * - [ ] Works on mobile (responsive layout)
 */

test.describe('US-2.1: View weekly calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createPlanWithMeals(page);
  });

  test('Shows 7 days in a grid/list layout', async ({ page }) => {
    for (let i = 0; i < 7; i++) {
      await expect(page.getByTestId(`day-${i}`)).toBeVisible();
    }
  });

  test('Each day shows 3 meal slots (breakfast, lunch, dinner)', async ({ page }) => {
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

  test('Day names reflect the start day', async ({ page }) => {
    // Default startDay is 5 (Saturday), so days should be Sat, Sun, Mon, Tue, Wed, Thu, Fri
    await expect(page.getByTestId('day-0').getByText('Saturday')).toBeVisible();
    await expect(page.getByTestId('day-1').getByText('Sunday')).toBeVisible();
    await expect(page.getByTestId('day-2').getByText('Monday')).toBeVisible();
  });
});
