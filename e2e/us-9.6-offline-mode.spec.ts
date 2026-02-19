import { test, expect } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

/**
 * US-9.6: Use the app offline
 *
 * As a user in an area with poor connectivity
 * I want the app to work offline
 * So that I can still view and interact with my meal plan and shopping list
 *
 * Acceptance Criteria:
 * - [ ] An offline banner appears when the browser goes offline
 * - [ ] The banner shows a helpful message about connectivity
 * - [ ] The banner disappears when the browser comes back online
 * - [ ] The offline banner has correct accessibility attributes
 * - [ ] Shopping list items can be checked off while offline (optimistic update)
 * - [ ] Checked state persists across an offline page reload
 *
 * Implementation note:
 * The OfflineBanner component reads `_isOnline` from the Zustand store.
 * `_isOnline` is updated by the `useOnlineSync` hook which listens to the
 * window `online` and `offline` events. Playwright's
 * `page.context().setOffline(true)` emulates these events, allowing us to
 * test offline behaviour without a real network interruption.
 */
test.describe('US-9.6: Use the app offline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await page.reload();
  });

  test('Offline banner appears when browser goes offline', async ({ page }) => {
    // Confirm banner is not shown while online
    await expect(page.getByTestId('offline-banner')).not.toBeVisible();

    // Simulate going offline — this fires the window 'offline' event which
    // useOnlineSync picks up and sets _isOnline to false in the store.
    await page.context().setOffline(true);

    // The OfflineBanner component should now render
    await expect(page.getByTestId('offline-banner')).toBeVisible();
  });

  test('Offline banner shows correct message', async ({ page }) => {
    await page.context().setOffline(true);
    await expect(page.getByTestId('offline-banner')).toBeVisible();

    // Exact text from OfflineBanner.tsx
    await expect(page.getByTestId('offline-banner')).toContainText(
      "You're offline"
    );
    await expect(page.getByTestId('offline-banner')).toContainText(
      'changes will sync when you reconnect'
    );
  });

  test('Offline banner disappears when browser comes back online', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    await expect(page.getByTestId('offline-banner')).toBeVisible();

    // Come back online
    await page.context().setOffline(false);

    // Banner should disappear
    await expect(page.getByTestId('offline-banner')).not.toBeVisible();
  });

  test('Offline banner has correct accessibility attributes', async ({ page }) => {
    await page.context().setOffline(true);

    const banner = page.getByTestId('offline-banner');
    await expect(banner).toBeVisible();

    // Must have role="status" and aria-live="polite" per OfflineBanner.tsx
    await expect(banner).toHaveAttribute('role', 'status');
    await expect(banner).toHaveAttribute('aria-live', 'polite');
  });

  test('Shopping list items can be checked off while offline (optimistic update)', async ({ page }) => {
    // Seed a plan so the shopping list page has items
    await page.evaluate(() => {
      const plan = {
        id: 'test-plan-offline',
        createdAt: new Date().toISOString(),
        preferences: { startDay: 5 },
        meals: [
          { id: 'meal-o-0-b', dayIndex: 0, mealType: 'breakfast', recipeId: 'breakfast-1', servings: 4 },
          { id: 'meal-o-0-l', dayIndex: 0, mealType: 'lunch', recipeId: 'lunch-1', servings: 4 },
          { id: 'meal-o-0-d', dayIndex: 0, mealType: 'dinner', recipeId: 'dinner-1', servings: 4 },
        ],
      };

      const state = {
        state: {
          currentPlan: plan,
          checkedItems: {},
          userRecipes: [],
          customShoppingItems: [],
        },
        version: 2,
      };

      localStorage.setItem('food-plan-storage', JSON.stringify(state));
    });

    await page.goto('/shopping-list');
    await expect(page.getByTestId('shopping-list')).toBeVisible();

    // Go offline
    await page.context().setOffline(true);
    await expect(page.getByTestId('offline-banner')).toBeVisible();

    // Clicking a checkbox should work optimistically (local state update).
    // The Checkbox component renders as button[role="checkbox"], not input[type="checkbox"].
    const firstCheckbox = page.locator('[role="checkbox"]').first();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'false');
    await firstCheckbox.click();

    // The checkbox should be checked immediately (optimistic local update)
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');
  });

  test('Checked state persists across offline page reload', async ({ page }) => {
    // Seed a plan with a pre-checked custom item in localStorage.
    // Custom items have IDs starting with 'custom-' so we use a stable test ID.
    const customItemId = 'custom-offline-test-item';

    await page.evaluate((itemId) => {
      const plan = {
        id: 'test-plan-offline-reload',
        createdAt: new Date().toISOString(),
        preferences: { startDay: 5 },
        meals: [],
      };

      // quantity must be a number (not string) to match CustomShoppingListItem type
      const state = {
        state: {
          currentPlan: plan,
          checkedItems: { [itemId]: 'test@example.com' },
          userRecipes: [],
          customShoppingItems: [
            {
              id: itemId,
              ingredient: 'Offline Test Item',
              quantity: 1,
              unit: '',
              category: 'uncategorized',
            },
          ],
        },
        version: 2,
      };

      localStorage.setItem('food-plan-storage', JSON.stringify(state));
    }, customItemId);

    await page.goto('/shopping-list');
    await expect(page.getByTestId('shopping-list')).toBeVisible();

    // The Checkbox component uses data-testid="checkbox-{id}" and role="checkbox".
    // Verify the item is checked before going offline.
    const checkbox = page.getByTestId(`checkbox-${customItemId}`);
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toHaveAttribute('aria-checked', 'true');

    // Go offline and reload
    await page.context().setOffline(true);
    await page.reload();

    // After offline reload, the shopping list should still render from localStorage
    await expect(page.getByTestId('shopping-list')).toBeVisible();

    // The pre-checked state should be restored from persisted localStorage
    const checkboxAfterReload = page.getByTestId(`checkbox-${customItemId}`);
    await expect(checkboxAfterReload).toHaveAttribute('aria-checked', 'true');
  });
});
