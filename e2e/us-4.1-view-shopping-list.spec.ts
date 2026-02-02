import { test, expect } from '@playwright/test';
import { clearAppState, createDefaultPlan } from './helpers/test-utils';

test.describe('US-4.1: View shopping list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createDefaultPlan(page);
    await page.goto('/shopping-list');
  });

  test('shopping list is auto-generated from the current meal plan', async ({ page }) => {
    await expect(page.getByTestId('shopping-list')).toBeVisible();

    // Should have items
    const items = page.locator('[data-testid^="item-"]');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('ingredients are grouped by category', async ({ page }) => {
    // Check for category sections - at least one should be visible
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

  test('shows quantity and unit for each item', async ({ page }) => {
    // Get first item and verify it shows quantity/unit format
    const firstItem = page.locator('[data-testid^="item-"]').first();
    const text = await firstItem.textContent();

    // Should contain a number (quantity) and unit
    expect(text).toMatch(/\d+/);
  });

  test('shows progress counter', async ({ page }) => {
    const counter = page.getByTestId('progress-counter');
    await expect(counter).toBeVisible();
    await expect(counter).toContainText('/');
    await expect(counter).toContainText('items');
  });

  test('empty state when no plan exists', async ({ page }) => {
    await clearAppState(page);
    await page.reload();

    await expect(page.getByText('No meal plan found')).toBeVisible();
    await expect(page.getByText('Create Meal Plan')).toBeVisible();
  });
});
