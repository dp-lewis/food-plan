import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-4.4: Filter Shopping List Items
 *
 * As a user with a long shopping list,
 * I want to filter out items I've already checked off,
 * So that I can focus on what's left to buy without scrolling past completed items.
 *
 * Acceptance Criteria:
 * - [x] Filter toggle visible on shopping list screen
 * - [x] When enabled, checked items are hidden
 * - [x] Summary shows how many items are hidden
 * - [x] Filter preference is persisted across sessions
 * - [x] Tapping summary or toggling off shows all items again
 * - [x] All done state when all items are checked and filter is on
 */

test.describe('US-4.4: Filter Shopping List Items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');
  });

  test('Filter toggle is visible on the shopping list screen', async ({ page }) => {
    const toggle = page.getByTestId('filter-checked-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText('Hide checked');
  });

  test('Filter toggle has correct initial state (off)', async ({ page }) => {
    const toggle = page.getByTestId('filter-checked-toggle');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('Enabling filter hides checked items', async ({ page }) => {
    // Check the first item
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');

    const totalBefore = await page.locator('[data-testid^="checkbox-"]').count();

    // Enable the filter
    await page.getByTestId('filter-checked-toggle').click();

    // Fewer items should now be visible
    const totalAfter = await page.locator('[data-testid^="checkbox-"]').count();
    expect(totalAfter).toBeLessThan(totalBefore);
  });

  test('Hidden count summary is shown when filter is active', async ({ page }) => {
    // Check an item
    await page.locator('[data-testid^="checkbox-"]').first().click();

    // Enable the filter
    await page.getByTestId('filter-checked-toggle').click();

    // Summary should appear
    const summary = page.getByTestId('hidden-count-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('hidden');
  });

  test('Hidden count summary shows correct count', async ({ page }) => {
    // Check two items
    const checkboxes = page.locator('[data-testid^="checkbox-"]');
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Enable the filter
    await page.getByTestId('filter-checked-toggle').click();

    const summary = page.getByTestId('hidden-count-summary');
    await expect(summary).toContainText('2 checked items hidden');
  });

  test('Tapping the summary reveals all items (toggles filter off)', async ({ page }) => {
    // Check an item
    await page.locator('[data-testid^="checkbox-"]').first().click();
    const totalBefore = await page.locator('[data-testid^="checkbox-"]').count();

    // Enable the filter
    await page.getByTestId('filter-checked-toggle').click();

    // Tap the summary to reveal
    await page.getByTestId('hidden-count-summary').click();

    // All items should be visible again
    const totalAfter = await page.locator('[data-testid^="checkbox-"]').count();
    expect(totalAfter).toBe(totalBefore);
  });

  test('Toggling filter off shows all items again', async ({ page }) => {
    // Check an item
    await page.locator('[data-testid^="checkbox-"]').first().click();
    const totalBefore = await page.locator('[data-testid^="checkbox-"]').count();

    // Enable filter
    await page.getByTestId('filter-checked-toggle').click();

    // Disable filter
    await page.getByTestId('filter-checked-toggle').click();

    // All items should be visible again
    const totalAfter = await page.locator('[data-testid^="checkbox-"]').count();
    expect(totalAfter).toBe(totalBefore);
  });

  test('Filter preference persists across page reloads', async ({ page }) => {
    // Enable filter
    const toggle = page.getByTestId('filter-checked-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    // Reload
    await page.reload();

    // Filter should still be on
    const toggleAfter = page.getByTestId('filter-checked-toggle');
    await expect(toggleAfter).toHaveAttribute('aria-pressed', 'true');
  });
});
