import { test, expect } from '@playwright/test';
import { clearAppState, createDefaultPlan } from './helpers/test-utils';

/**
 * US-5.1: View current plan summary
 *
 * As a returning user
 * I want to see a summary of my current meal plan on the home screen
 * So that I can quickly access this week's meals
 *
 * Acceptance Criteria:
 * - [ ] Dashboard shows current meal plan if one exists
 * - [ ] Shows "Up Next" meal slot prominently (all meals in that slot)
 * - [ ] Plan day calculated from creation date (day 0 = day plan was created)
 * - [ ] Shows tomorrow preview before 3pm
 * - [ ] Shows shopping list progress (X of Y items checked)
 * - [ ] Quick link to full calendar view
 * - [ ] Quick link to shopping list
 */

test.describe('US-5.1: View current plan summary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createDefaultPlan(page);
    // Navigate back to dashboard
    await page.goto('/');
  });

  test('Dashboard shows current meal plan if one exists', async ({ page }) => {
    // Should show the dashboard (not empty state)
    await expect(page.getByTestId('dashboard')).toBeVisible();
    await expect(page.getByTestId('empty-state')).not.toBeVisible();
  });

  test('Shows up-next meal slot prominently', async ({ page }) => {
    // Should show at least one of: up-next card, tomorrow preview
    // The specific content depends on time of day, but something meal-related should be visible
    const upNextCard = page.getByTestId('up-next-card');
    const tomorrowPreview = page.getByTestId('tomorrow-preview');

    // At least one meal-related card should be visible
    const hasUpNext = await upNextCard.isVisible().catch(() => false);
    const hasTomorrow = await tomorrowPreview.isVisible().catch(() => false);

    expect(hasUpNext || hasTomorrow).toBe(true);
  });

  test('Up next card shows all meals in slot', async ({ page }) => {
    const upNextCard = page.getByTestId('up-next-card');

    // If up-next card is visible, it should have meal details
    if (await upNextCard.isVisible().catch(() => false)) {
      // Should show at least one meal with recipe link
      const recipeLink = page.getByTestId('up-next-recipe-link');
      await expect(recipeLink).toBeVisible();

      // Should show meal type (breakfast, lunch, or dinner)
      const cardText = await upNextCard.textContent();
      const hasMealType =
        cardText?.toLowerCase().includes('breakfast') ||
        cardText?.toLowerCase().includes('lunch') ||
        cardText?.toLowerCase().includes('dinner');
      expect(hasMealType).toBe(true);

      // All meals in the slot should be displayed (check for meal test IDs)
      const mealItems = upNextCard.locator('[data-testid^="up-next-meal-"]');
      const mealCount = await mealItems.count();
      expect(mealCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('Quick link to full calendar view', async ({ page }) => {
    const fullPlanLink = page.getByTestId('view-full-plan-link');
    await expect(fullPlanLink).toBeVisible();

    await fullPlanLink.click();
    await expect(page).toHaveURL('/plan/current');
  });

  test('Quick link to shopping list', async ({ page }) => {
    // Shopping list link is in the shopping status card
    const shoppingLink = page.getByTestId('shopping-status-link');
    await expect(shoppingLink).toBeVisible();

    await shoppingLink.click();
    await expect(page).toHaveURL('/shopping-list');
  });

  test('Shows shopping list progress', async ({ page }) => {
    const shoppingCard = page.getByTestId('shopping-status-card');
    await expect(shoppingCard).toBeVisible();

    // Should show item count
    const cardText = await shoppingCard.textContent();
    expect(cardText).toMatch(/\d+ of \d+ items|Shopping complete/);
  });
});
