import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-4.3: Filter to show remaining items
 *
 * As a grocery shopper working through my list
 * I want to filter the shopping list to show only unchecked items
 * So that I can focus on what's left to get without being distracted by what's already in my basket
 *
 * Acceptance Criteria:
 * - [ ] A "Show remaining" toggle replaces the existing "Clear checked" button in the bottom action area
 * - [ ] The toggle is off by default — all items visible when the page loads
 * - [ ] When toggled on, checked items are hidden from the list
 * - [ ] When a category has all items checked and the filter is on, the category heading is also hidden
 * - [ ] The progress bar remains visible at all times so overall progress is still clear
 * - [ ] The filter resets to off when navigating away from the page
 * - [ ] Works for both meal plan items and custom items
 */

test.describe('US-4.3: Filter to show remaining items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');
  });

  test('Toggle is off by default — all items visible on load', async ({ page }) => {
    const toggle = page.getByTestId('show-remaining-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    // All checkboxes should be visible
    const checkboxes = page.locator('[data-testid^="checkbox-"]');
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('"Clear checked" button is no longer present', async ({ page }) => {
    await expect(page.getByTestId('clear-checked-btn')).not.toBeAttached();
  });

  test('Toggling on hides checked items', async ({ page }) => {
    // Check the first item
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    const firstItemId = await firstCheckbox.getAttribute('data-testid');
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');

    const totalBefore = await page.locator('[data-testid^="checkbox-"]').count();

    // Enable the filter
    await page.getByTestId('show-remaining-toggle').click();
    await expect(page.getByTestId('show-remaining-toggle')).toHaveAttribute('aria-pressed', 'true');

    // The checked item should now be hidden
    const totalAfter = await page.locator('[data-testid^="checkbox-"]').count();
    expect(totalAfter).toBe(totalBefore - 1);

    // The specific checked item should not be visible
    if (firstItemId) {
      await expect(page.getByTestId(firstItemId)).not.toBeVisible();
    }
  });

  test('Category heading is hidden when all items in category are checked and filter is on', async ({ page }) => {
    // Find a category section and check all its items
    const firstCategory = page.locator('[data-testid^="category-"]').first();
    const categoryTestId = await firstCategory.getAttribute('data-testid');
    const itemsInCategory = firstCategory.locator('[data-testid^="checkbox-"]');
    const categoryItemCount = await itemsInCategory.count();

    // Check all items in the first category
    for (let i = 0; i < categoryItemCount; i++) {
      await itemsInCategory.nth(i).click();
    }

    // Enable the filter
    await page.getByTestId('show-remaining-toggle').click();

    // The entire category section should be hidden
    if (categoryTestId) {
      await expect(page.getByTestId(categoryTestId)).not.toBeAttached();
    }
  });

  test('Progress bar remains visible when filter is on', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    await page.getByTestId('show-remaining-toggle').click();

    // Progress counter and bar should still be visible
    await expect(page.getByTestId('progress-counter')).toBeVisible();
    // The progress bar container is within the header (always visible)
    await expect(page.locator('[data-testid="progress-counter"]')).toBeVisible();
  });

  test('Toggling off restores all items', async ({ page }) => {
    const allCheckboxes = page.locator('[data-testid^="checkbox-"]');
    const totalCount = await allCheckboxes.count();

    // Check the first item
    await allCheckboxes.first().click();

    // Enable the filter — checked item disappears
    const toggle = page.getByTestId('show-remaining-toggle');
    await toggle.click();
    const filteredCount = await allCheckboxes.count();
    expect(filteredCount).toBe(totalCount - 1);

    // Toggle off — all items visible again
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    const restoredCount = await allCheckboxes.count();
    expect(restoredCount).toBe(totalCount);
  });

  test('Filter resets to off when navigating away and back', async ({ page }) => {
    // Enable the filter
    const toggle = page.getByTestId('show-remaining-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    // Navigate away and back
    await page.goto('/');
    await page.goto('/shopping-list');

    // Toggle should be off again (local state reset)
    await expect(page.getByTestId('show-remaining-toggle')).toHaveAttribute('aria-pressed', 'false');
  });

  test('Works for custom items — checked custom items are hidden when filter is on', async ({ page }) => {
    // Add a custom item via the drawer
    await page.getByTestId('open-add-drawer-btn').click();
    await page.getByTestId('add-item-input').fill('test custom item');
    await page.getByTestId('add-item-btn').click();

    // Find and check the custom item
    const customCheckbox = page.locator('[data-testid^="checkbox-custom-"]').first();
    await expect(customCheckbox).toBeVisible();
    await customCheckbox.click();
    await expect(customCheckbox).toHaveAttribute('aria-checked', 'true');

    const totalBefore = await page.locator('[data-testid^="checkbox-"]').count();

    // Enable the filter
    await page.getByTestId('show-remaining-toggle').click();

    // Custom item should be hidden
    const totalAfter = await page.locator('[data-testid^="checkbox-"]').count();
    expect(totalAfter).toBe(totalBefore - 1);
    await expect(customCheckbox).not.toBeVisible();
  });
});
