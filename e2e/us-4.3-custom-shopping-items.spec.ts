import { test, expect } from '@playwright/test';
import { clearAppState, createDefaultPlan } from './helpers/test-utils';

/**
 * US-4.3: Add custom items to shopping list
 *
 * As a grocery shopper
 * I want to add non-food items to my shopping list
 * So that I can track all my shopping needs in one place
 *
 * Acceptance Criteria:
 * - [x] Can add a custom item via text input
 * - [x] Custom items appear in the shopping list
 * - [x] Custom items can be checked/unchecked like generated items
 * - [x] Custom items can be deleted
 * - [x] Custom items persist in localStorage
 * - [x] Custom items survive meal plan regeneration
 * - [x] Auto-categorizes food items (e.g., "milk" -> dairy)
 * - [x] Non-food items go to "Other" category
 */

test.describe('US-4.3: Add custom items to shopping list', () => {
  test.describe('With existing meal plan', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await clearAppState(page);
      await createDefaultPlan(page);
      await page.goto('/shopping-list');
    });

    test('Can add a custom item via text input', async ({ page }) => {
      // Open the drawer
      await page.getByTestId('open-add-drawer-btn').click();

      const input = page.getByTestId('add-item-input');
      const addBtn = page.getByTestId('add-item-btn');

      await input.fill('toilet paper');
      await addBtn.click();

      // Drawer should close and item should appear in list
      await expect(page.getByText('Toilet paper')).toBeVisible();
    });

    test('Can add item by pressing Enter', async ({ page }) => {
      // Open the drawer
      await page.getByTestId('open-add-drawer-btn').click();

      const input = page.getByTestId('add-item-input');

      await input.fill('bin bags');
      await input.press('Enter');

      // Drawer should close and item should appear
      await expect(page.getByText('Bin bags')).toBeVisible();
    });

    test('Add button is disabled when input is empty', async ({ page }) => {
      // Open the drawer
      await page.getByTestId('open-add-drawer-btn').click();

      const addBtn = page.getByTestId('add-item-btn');
      await expect(addBtn).toBeDisabled();
    });

    test('Custom items can be checked/unchecked', async ({ page }) => {
      // Open drawer and add a custom item
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('toilet paper');
      await page.getByTestId('add-item-btn').click();

      // Find the custom item checkbox
      const customItem = page.locator('[data-testid^="item-custom-"]').first();
      const checkbox = customItem.getByRole('checkbox');

      // Check the item
      await checkbox.click();
      await expect(checkbox).toBeChecked();

      // Uncheck the item
      await checkbox.click();
      await expect(checkbox).not.toBeChecked();
    });

    test('Custom items can be deleted', async ({ page }) => {
      // Open drawer and add a custom item
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('toilet paper');
      await page.getByTestId('add-item-btn').click();

      await expect(page.getByText('Toilet paper')).toBeVisible();

      // Find and click the delete button
      const deleteBtn = page.locator('[data-testid^="delete-custom-"]').first();
      await deleteBtn.click();

      // Item should be removed
      await expect(page.getByText('Toilet paper')).not.toBeVisible();
    });

    test('Custom items persist after page reload', async ({ page }) => {
      // Open drawer and add a custom item
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('toilet paper');
      await page.getByTestId('add-item-btn').click();

      await expect(page.getByText('Toilet paper')).toBeVisible();

      // Reload the page
      await page.reload();

      // Item should still be there
      await expect(page.getByText('Toilet paper')).toBeVisible();
    });

    test('Custom items survive meal plan regeneration', async ({ page }) => {
      // Open drawer and add a custom item
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('toilet paper');
      await page.getByTestId('add-item-btn').click();

      await expect(page.getByText('Toilet paper')).toBeVisible();

      // Create a new meal plan
      await createDefaultPlan(page);
      await page.goto('/shopping-list');

      // Custom item should still be there
      await expect(page.getByText('Toilet paper')).toBeVisible();
    });

    test('Auto-categorizes food items to correct category', async ({ page }) => {
      // Open drawer and add butter - should go to dairy
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('butter');
      await page.getByTestId('add-item-btn').click();

      // Check the custom item is in the dairy category
      const dairySection = page.getByTestId('category-dairy');
      const customItem = dairySection.locator('[data-testid^="item-custom-"]');
      await expect(customItem).toContainText('Butter');
    });

    test('Non-food items go to Other category', async ({ page }) => {
      // Open drawer and add non-food item
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('light bulbs');
      await page.getByTestId('add-item-btn').click();

      // Wait for the custom item to appear
      const customItem = page.locator('[data-testid^="item-custom-"]').filter({ hasText: 'Light bulbs' });
      await expect(customItem).toBeVisible();

      // Verify the "Other" section header exists (for uncategorized items)
      await expect(page.getByRole('heading', { name: 'Other' })).toBeVisible();
    });

    test('Parses quantity and unit from input', async ({ page }) => {
      // Open drawer and add item with quantity
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('2 bottles cleaning spray');
      await page.getByTestId('add-item-btn').click();

      // Should show quantity and unit (case-insensitive check)
      const item = page.locator('[data-testid^="item-custom-"]').first();
      await expect(item).toContainText('2');
      await expect(item).toContainText(/bottles/i);
    });

    test('Can add multiple items with comma separation', async ({ page }) => {
      // Open drawer and add multiple items at once (using unique names)
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('toilet paper, laundry powder, dish soap');
      await page.getByTestId('add-item-btn').click();

      // Should have 3 custom items
      const customItems = page.locator('[data-testid^="item-custom-"]');
      await expect(customItems).toHaveCount(3);

      // Check each item appears (within custom items only)
      await expect(customItems.filter({ hasText: /toilet paper/i })).toHaveCount(1);
      await expect(customItems.filter({ hasText: /laundry powder/i })).toHaveCount(1);
      await expect(customItems.filter({ hasText: /dish soap/i })).toHaveCount(1);
    });

    test('Can add multiple items with "and" separation', async ({ page }) => {
      // Open drawer and add multiple items using "and" (using unique names)
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('paper towels and sponges and bin bags');
      await page.getByTestId('add-item-btn').click();

      // Should have 3 custom items
      const customItems = page.locator('[data-testid^="item-custom-"]');
      await expect(customItems).toHaveCount(3);

      // Check each item appears (within custom items only)
      await expect(customItems.filter({ hasText: /paper towels/i })).toHaveCount(1);
      await expect(customItems.filter({ hasText: /sponges/i })).toHaveCount(1);
      await expect(customItems.filter({ hasText: /bin bags/i })).toHaveCount(1);
    });

    test('Custom items are included in progress counter', async ({ page }) => {
      const counter = page.getByTestId('progress-counter');
      const initialText = await counter.textContent();
      const initialTotal = parseInt(initialText?.split('/')[1] || '0');

      // Open drawer and add a custom item
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('toilet paper');
      await page.getByTestId('add-item-btn').click();

      // Counter should increase
      const newText = await counter.textContent();
      const newTotal = parseInt(newText?.split('/')[1] || '0');
      expect(newTotal).toBe(initialTotal + 1);
    });

    test('Only custom items show delete button', async ({ page }) => {
      // Open drawer and add a custom item
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('toilet paper');
      await page.getByTestId('add-item-btn').click();

      // Custom items should have delete button
      const customDeleteBtns = page.locator('[data-testid^="delete-custom-"]');
      await expect(customDeleteBtns.first()).toBeVisible();

      // Generated items should not have delete button
      const generatedItem = page.locator('[data-testid^="item-item-"]').first();
      const deleteBtn = generatedItem.locator('[data-testid^="delete-"]');
      await expect(deleteBtn).not.toBeVisible();
    });
  });

  test.describe('Without meal plan', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await clearAppState(page);
      await page.goto('/shopping-list');
    });

    test('Shows add button even without a meal plan', async ({ page }) => {
      await expect(page.getByTestId('open-add-drawer-btn')).toBeVisible();
    });

    test('Can add items without a meal plan', async ({ page }) => {
      // Open drawer and add item
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('toilet paper');
      await page.getByTestId('add-item-btn').click();

      await expect(page.getByText('Toilet paper')).toBeVisible();
    });

    test('Shows shopping list view when custom items exist but no plan', async ({ page }) => {
      // Open drawer and add item
      await page.getByTestId('open-add-drawer-btn').click();
      await page.getByTestId('add-item-input').fill('toilet paper');
      await page.getByTestId('add-item-btn').click();

      // Should show the shopping list (not empty state)
      await expect(page.getByTestId('shopping-list')).toBeVisible();
    });

    test('Drawer closes after adding item', async ({ page }) => {
      // Open drawer
      await page.getByTestId('open-add-drawer-btn').click();
      await expect(page.getByTestId('add-item-input')).toBeVisible();

      // Add item
      await page.getByTestId('add-item-input').fill('toilet paper');
      await page.getByTestId('add-item-btn').click();

      // Drawer should be closed (input no longer visible)
      await expect(page.getByTestId('add-item-input')).not.toBeVisible();
    });
  });
});
