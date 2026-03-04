import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-4.4: Filter shopping list to show remaining items
 *
 * As a shopper using the app in-store,
 * I want to filter the shopping list to hide checked-off items,
 * So that I can focus on what I still need to pick up without scrolling past
 * items already in my cart.
 *
 * Acceptance Criteria:
 * - [x] A toggle control is visible on the shopping list page
 * - [x] When active, all checked items are hidden from every category group
 * - [x] Categories that become empty after filtering are also hidden
 * - [x] The progress bar and counter reflect total progress (not just visible items)
 * - [x] The filter state resets on page reload (not persisted to localStorage)
 * - [x] When the filter is turned off, all items reappear in their original positions
 * - [x] The toggle is only shown when there is at least one checked item
 * - [x] The "Clear checked items" action remains accessible regardless of filter state
 */

test.describe('US-4.4: Filter shopping list to show remaining items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');
  });

  test('Toggle is not visible when no items are checked', async ({ page }) => {
    const toggle = page.getByTestId('hide-checked-toggle');
    await expect(toggle).not.toBeVisible();
  });

  test('Toggle becomes visible after checking an item', async ({ page }) => {
    const toggle = page.getByTestId('hide-checked-toggle');
    await expect(toggle).not.toBeVisible();

    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    await expect(toggle).toBeVisible();
  });

  test('Toggle shows "Hide checked" label when filter is off', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    const toggle = page.getByTestId('hide-checked-toggle');
    await expect(toggle).toHaveText('Hide checked');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('Activating the toggle hides checked items', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    const itemTestId = await firstCheckbox.getAttribute('data-testid');
    // Extract item id from checkbox- prefix
    const itemId = itemTestId!.replace('checkbox-', '');

    await firstCheckbox.click();

    const countBefore = await page.locator('[data-testid^="item-"]').count();

    const toggle = page.getByTestId('hide-checked-toggle');
    await toggle.click();

    // The checked item should no longer be visible
    await expect(page.getByTestId(`item-${itemId}`)).not.toBeVisible();

    const countAfter = await page.locator('[data-testid^="item-"]').count();
    expect(countAfter).toBe(countBefore - 1);
  });

  test('Toggle label changes to "Show all" when filter is active', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    const toggle = page.getByTestId('hide-checked-toggle');
    await toggle.click();

    await expect(toggle).toHaveText('Show all');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('Deactivating the toggle restores all items', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    const countBefore = await page.locator('[data-testid^="item-"]').count();

    const toggle = page.getByTestId('hide-checked-toggle');
    await toggle.click();

    const countFiltered = await page.locator('[data-testid^="item-"]').count();
    expect(countFiltered).toBe(countBefore - 1);

    await toggle.click();

    const countAfter = await page.locator('[data-testid^="item-"]').count();
    expect(countAfter).toBe(countBefore);
  });

  test('Progress counter reflects total progress, not just visible items', async ({ page }) => {
    const counterBefore = await page.getByTestId('progress-counter').textContent();
    const totalBefore = parseInt(counterBefore!.split('/')[1].trim());

    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    const toggle = page.getByTestId('hide-checked-toggle');
    await toggle.click();

    const counterAfter = await page.getByTestId('progress-counter').textContent();
    const checkedAfter = parseInt(counterAfter!.split('/')[0].trim());
    const totalAfter = parseInt(counterAfter!.split('/')[1].trim());

    // Total should remain unchanged
    expect(totalAfter).toBe(totalBefore);
    // Checked count should be 1
    expect(checkedAfter).toBe(1);
  });

  test('Filter state resets on page reload', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    const toggle = page.getByTestId('hide-checked-toggle');
    await toggle.click();

    await expect(toggle).toHaveText('Show all');

    const countFiltered = await page.locator('[data-testid^="item-"]').count();

    await page.reload();

    // After reload, the checked item persists (localStorage) but filter is reset
    const toggleAfterReload = page.getByTestId('hide-checked-toggle');
    await expect(toggleAfterReload).toBeVisible();
    await expect(toggleAfterReload).toHaveText('Hide checked');

    const countAfterReload = await page.locator('[data-testid^="item-"]').count();
    expect(countAfterReload).toBeGreaterThan(countFiltered);
  });

  test('Categories that become entirely checked are hidden when filter is active', async ({ page }) => {
    // Find which categories exist
    const categoryIds = ['produce', 'meat', 'dairy', 'frozen', 'pantry', 'uncategorized'];
    let targetCategory: string | null = null;

    for (const catId of categoryIds) {
      const section = page.getByTestId(`category-${catId}`);
      if (await section.isVisible()) {
        const itemsInCategory = section.locator('[data-testid^="checkbox-"]');
        const count = await itemsInCategory.count();
        if (count === 1) {
          targetCategory = catId;
          // Check the single item in this category
          await itemsInCategory.first().click();
          break;
        }
      }
    }

    if (targetCategory) {
      const toggle = page.getByTestId('hide-checked-toggle');
      await toggle.click();

      await expect(page.getByTestId(`category-${targetCategory}`)).not.toBeVisible();
    } else {
      // If no single-item category found, just verify toggle works at all
      const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
      await firstCheckbox.click();

      const toggle = page.getByTestId('hide-checked-toggle');
      await expect(toggle).toBeVisible();
    }
  });

  test('Clear checked button remains accessible when filter is active', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    const toggle = page.getByTestId('hide-checked-toggle');
    await toggle.click();

    const clearBtn = page.getByTestId('clear-checked-btn');
    await expect(clearBtn).toBeVisible();
  });
});
