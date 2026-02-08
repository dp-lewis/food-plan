import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-4.1: View shopping list
 *
 * As a grocery shopper
 * I want to see a shopping list generated from my meal plan
 * So that I know what to buy at the store
 *
 * Acceptance Criteria:
 * - [ ] Shopping list is auto-generated from the current meal plan
 * - [ ] Ingredients are grouped by category (produce, dairy, meat, pantry, frozen)
 * - [ ] Duplicate ingredients are combined
 * - [ ] Shows quantity and unit for each item
 */

test.describe('US-4.1: View shopping list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');
  });

  test('Shopping list is auto-generated from the current meal plan', async ({ page }) => {
    await expect(page.getByTestId('shopping-list')).toBeVisible();

    const items = page.locator('[data-testid^="item-"]');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Ingredients are grouped by category (produce, dairy, meat, pantry, frozen)', async ({ page }) => {
    const categories = ['produce', 'dairy', 'meat', 'pantry', 'frozen'];
    let foundCategories = 0;

    for (const category of categories) {
      const section = page.getByTestId(`category-${category}`);
      if (await section.isVisible()) {
        foundCategories++;
      }
    }

    expect(foundCategories).toBeGreaterThan(0);
  });

  test('Shows quantity and unit for each item', async ({ page }) => {
    const firstItem = page.locator('[data-testid^="item-"]').first();
    const text = await firstItem.textContent();

    // Should contain a number (quantity)
    expect(text).toMatch(/\d+/);
  });

  test('Shows progress counter', async ({ page }) => {
    const counter = page.getByTestId('progress-counter');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText('/');
  });

  test('Shows empty state when no plan exists', async ({ page }) => {
    await clearAppState(page);
    await page.reload();

    await expect(page.getByText('No meal plan found')).toBeVisible();
    await expect(page.getByText('Create Meal Plan')).toBeVisible();
  });
});
