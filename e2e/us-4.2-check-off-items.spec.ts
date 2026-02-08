import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-4.2: Check off items
 *
 * As a grocery shopper
 * I want to check off items as I add them to my cart
 * So that I can track my progress through the store
 *
 * Acceptance Criteria:
 * - [ ] Can tap an item to mark it as checked
 * - [ ] Checked items are visually distinct (strikethrough, dimmed, or moved)
 * - [ ] Checked state persists in localStorage
 * - [ ] Can uncheck an item
 */

test.describe('US-4.2: Check off items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');
  });

  test('Can tap an item to mark it as checked', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    // Checkbox should be checked via aria-checked
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');
  });

  test('Checked items are visually distinct (strikethrough)', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    // Label wrapper span (second span in button, after checkbox visual) should have strikethrough
    const textSpan = firstCheckbox.locator('> span').nth(1);
    await expect(textSpan).toHaveCSS('text-decoration-line', 'line-through');
  });

  test('Checked state persists in localStorage', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    const counterBefore = await page.getByTestId('progress-counter').textContent();
    const checkedBefore = parseInt(counterBefore!.split('/')[0].trim());

    await page.reload();

    const counterAfter = await page.getByTestId('progress-counter').textContent();
    const checkedAfter = parseInt(counterAfter!.split('/')[0].trim());

    expect(checkedAfter).toBe(checkedBefore);
  });

  test('Can uncheck an item', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();

    // Check the item
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');

    // Uncheck the item
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'false');
  });

  test('Progress counter updates when checking items', async ({ page }) => {
    const counterBefore = await page.getByTestId('progress-counter').textContent();
    const checkedBefore = parseInt(counterBefore!.split('/')[0].trim());

    await page.locator('[data-testid^="checkbox-"]').first().click();

    const counterAfter = await page.getByTestId('progress-counter').textContent();
    const checkedAfter = parseInt(counterAfter!.split('/')[0].trim());

    expect(checkedAfter).toBe(checkedBefore + 1);
  });
});
