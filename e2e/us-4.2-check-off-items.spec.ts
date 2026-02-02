import { test, expect } from '@playwright/test';
import { clearAppState, createDefaultPlan } from './helpers/test-utils';

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
    await createDefaultPlan(page);
    await page.goto('/shopping-list');
  });

  test('Can tap an item to mark it as checked', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    const textSpan = firstCheckbox.locator('span.text-left');
    await expect(textSpan).toHaveCSS('text-decoration-line', 'line-through');
  });

  test('Checked items are visually distinct (strikethrough)', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    const textSpan = firstCheckbox.locator('span.text-left');
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
    let textSpan = firstCheckbox.locator('span.text-left');
    await expect(textSpan).toHaveCSS('text-decoration-line', 'line-through');

    // Uncheck the item
    await firstCheckbox.click();
    textSpan = firstCheckbox.locator('span.text-left');
    await expect(textSpan).toHaveCSS('text-decoration-line', 'none');
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
