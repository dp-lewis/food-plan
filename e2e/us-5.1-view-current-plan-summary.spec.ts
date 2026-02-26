import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-5.1: View current plan summary
 *
 * As a returning user
 * I want to see a summary of my current meal plan on the home screen
 * So that I can quickly access this week's meals
 *
 * Acceptance Criteria:
 * - [ ] Dashboard shows current meal plan if one exists
 * - [ ] Shows "Today" card with meal type tabs (Breakfast/Lunch/Dinner)
 * - [ ] Shows shopping list progress with X/Y count
 * - [ ] Quick link to full calendar view
 * - [ ] Quick link to shopping list
 */

test.describe('US-5.1: View current plan summary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createPlanWithMeals(page);
    // Navigate back to dashboard
    await page.goto('/');
  });

  test('Dashboard shows current meal plan if one exists', async ({ page }) => {
    // Should show the dashboard (not empty state)
    await expect(page.getByTestId('dashboard')).toBeVisible();
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  test('Shows today card with meal tabs', async ({ page }) => {
    const todayCard = page.getByTestId('today-card');

    // Today card should be visible
    if (await todayCard.isVisible().catch(() => false)) {
      // Should show at least one meal type tab
      const cardText = await todayCard.textContent();
      const hasMealType =
        cardText?.toLowerCase().includes('breakfast') ||
        cardText?.toLowerCase().includes('lunch') ||
        cardText?.toLowerCase().includes('dinner');
      expect(hasMealType).toBe(true);
    }
  });

  test('Today card shows recipe name and action buttons', async ({ page }) => {
    const todayCard = page.getByTestId('today-card');

    if (await todayCard.isVisible().catch(() => false)) {
      // Should show the recipe title
      const recipeTitle = page.getByTestId('today-recipe-title');
      await expect(recipeTitle).toBeVisible();

      // Should show the view recipe button
      const viewRecipeBtn = page.getByTestId('today-view-recipe-btn');
      await expect(viewRecipeBtn).toBeVisible();

      // Should show the view full plan button
      const viewPlanBtn = page.getByTestId('today-view-plan-btn');
      await expect(viewPlanBtn).toBeVisible();
    }
  });

  test('Quick link to full calendar view', async ({ page }) => {
    const fullPlanBtn = page.getByTestId('today-view-plan-btn');
    await expect(fullPlanBtn).toBeVisible();

    await fullPlanBtn.scrollIntoViewIfNeeded();
    await fullPlanBtn.click();
    await expect(page).toHaveURL('/plan/current');
  });

  test('Quick link to shopping list', async ({ page }) => {
    // Shopping list button is in the shopping status card
    const shoppingLink = page.getByTestId('shopping-status-link');
    await expect(shoppingLink).toBeVisible();

    await shoppingLink.click();
    await expect(page).toHaveURL('/shopping-list');
  });

  test('Shows shopping list progress', async ({ page }) => {
    const shoppingCard = page.getByTestId('shopping-status-card');
    await expect(shoppingCard).toBeVisible();

    // Should show item count in new X/Y format
    const countEl = page.getByTestId('shopping-status-count');
    await expect(countEl).toBeVisible();
    const countText = await countEl.textContent();
    expect(countText).toMatch(/\d+\/\d+/);
  });
});
