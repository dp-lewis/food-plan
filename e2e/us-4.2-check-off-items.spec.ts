import { test, expect } from '@playwright/test';
import { clearAppState, createDefaultPlan } from './helpers/test-utils';

test.describe('US-4.2: Check off items on shopping list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createDefaultPlan(page);
    await page.goto('/shopping-list');
  });

  test('can tap an item to mark it as checked', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    // Item text should have line-through style
    const itemButton = firstCheckbox;
    const textSpan = itemButton.locator('span.text-left');
    await expect(textSpan).toHaveCSS('text-decoration-line', 'line-through');
  });

  test('checked items are visually distinct (strikethrough)', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    // Find the text span and check for line-through
    const textSpan = firstCheckbox.locator('span.text-left');
    await expect(textSpan).toHaveCSS('text-decoration-line', 'line-through');
  });

  test('checked state persists in localStorage', async ({ page }) => {
    // Check first item
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();
    await firstCheckbox.click();

    // Get checked count before reload
    const counterBefore = await page.getByTestId('progress-counter').textContent();
    const checkedBefore = parseInt(counterBefore!.split('/')[0].trim());

    // Reload page
    await page.reload();

    // Check count is preserved
    const counterAfter = await page.getByTestId('progress-counter').textContent();
    const checkedAfter = parseInt(counterAfter!.split('/')[0].trim());

    expect(checkedAfter).toBe(checkedBefore);
  });

  test('can uncheck an item', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="checkbox-"]').first();

    // Check the item
    await firstCheckbox.click();

    // Verify checked
    let textSpan = firstCheckbox.locator('span.text-left');
    await expect(textSpan).toHaveCSS('text-decoration-line', 'line-through');

    // Uncheck the item
    await firstCheckbox.click();

    // Verify unchecked (no line-through)
    textSpan = firstCheckbox.locator('span.text-left');
    await expect(textSpan).toHaveCSS('text-decoration-line', 'none');
  });

  test('progress counter updates when checking items', async ({ page }) => {
    // Get initial count
    const counterBefore = await page.getByTestId('progress-counter').textContent();
    const checkedBefore = parseInt(counterBefore!.split('/')[0].trim());

    // Check first item
    await page.locator('[data-testid^="checkbox-"]').first().click();

    // Get new count
    const counterAfter = await page.getByTestId('progress-counter').textContent();
    const checkedAfter = parseInt(counterAfter!.split('/')[0].trim());

    expect(checkedAfter).toBe(checkedBefore + 1);
  });

  test('progress bar reflects checked items', async ({ page }) => {
    // Check an item
    await page.locator('[data-testid^="checkbox-"]').first().click();

    // Progress bar should have non-zero width
    const progressBar = page.locator('.h-2.rounded-full .h-full');
    const width = await progressBar.evaluate((el) => el.style.width);
    expect(width).not.toBe('0%');
  });
});
