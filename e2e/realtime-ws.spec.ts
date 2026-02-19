import { test, expect, type Page } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';
import { setupRealtimeMock } from './helpers/realtimeMock';

/**
 * Realtime WebSocket integration tests
 *
 * These tests verify the full "incoming WebSocket event → hook handler →
 * store reducer → React render" pipeline without a live Supabase instance.
 *
 * The Supabase Realtime WebSocket is intercepted via Playwright's
 * routeWebSocket. We simulate the Phoenix Channels protocol (join handshake,
 * heartbeat) and inject crafted postgres_changes / broadcast events to
 * confirm the UI updates correctly.
 *
 * Setup for each test:
 *   1. Seed localStorage with a plan (sets currentPlan after rehydration)
 *   2. Set up WebSocket mock (before any WS connection is made)
 *   3. Navigate to the page
 *   4. Set _userId via window.__setStoreState (triggers hook subscription)
 *   5. Wait for all three channels to join
 *   6. Inject the event and assert the UI
 */

const PLAN_ID = 'rt-test-plan';
const OTHER_USER_ID = 'other-user-123';
const TEST_USER_ID = 'test-user-456';

/** Base localStorage state: a plan with one meal (breakfast-1 on day 0) */
function buildLocalStorageState(extraMeals: object[] = [], checkedItems: Record<string, string> = {}, customItems: object[] = []) {
  return {
    state: {
      currentPlan: {
        id: PLAN_ID,
        createdAt: new Date().toISOString(),
        preferences: { startDay: 0 },
        meals: [
          { id: 'meal-existing-1', dayIndex: 0, mealType: 'breakfast', recipeId: 'breakfast-1', servings: 4 },
          ...extraMeals,
        ],
      },
      checkedItems,
      userRecipes: [],
      customShoppingItems: customItems,
    },
    version: 2,
  };
}

async function seedAndActivate(
  page: Page,
  state: ReturnType<typeof buildLocalStorageState>
) {
  await page.evaluate((s) => {
    localStorage.setItem('food-plan-storage', JSON.stringify(s));
  }, state);
}

test.describe('Realtime WebSocket integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  test('remote meal insert from another user appears in the plan view', async ({ page }) => {
    // Arrange
    const mock = await setupRealtimeMock(page);
    await seedAndActivate(page, buildLocalStorageState());
    await page.goto('/plan/current');
    await page.waitForSelector('[data-testid="meal-plan"]');

    // Activate realtime subscriptions
    await page.waitForFunction(() => typeof (window as unknown as Record<string, unknown>).__setStoreState === 'function');
    await page.evaluate((userId) => {
      (window as unknown as { __setStoreState: (s: Record<string, unknown>) => void }).__setStoreState({ _userId: userId });
    }, TEST_USER_ID);
    await mock.waitForChannelsReady();

    // Act — inject a meal INSERT from the other user
    mock.injectMealInsert(PLAN_ID, {
      id: 'meal-remote-new',
      meal_plan_id: PLAN_ID,
      day_index: 0,
      meal_type: 'dinner',
      recipe_id: 'dinner-1',
      servings: 4,
      user_id: OTHER_USER_ID,
    });

    // Assert — "Spaghetti Bolognese" (dinner-1) should appear
    await expect(page.getByTestId('meal-meal-remote-new')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Spaghetti Bolognese')).toBeVisible();
  });

  test('remote meal delete from another user removes it from the plan view', async ({ page }) => {
    // Arrange — seed plan with an extra meal that will be deleted
    const mock = await setupRealtimeMock(page);
    await seedAndActivate(page, buildLocalStorageState([
      { id: 'meal-to-delete', dayIndex: 1, mealType: 'dinner', recipeId: 'dinner-1', servings: 4 },
    ]));
    await page.goto('/plan/current');
    await page.waitForSelector('[data-testid="meal-meal-to-delete"]');

    await page.waitForFunction(() => typeof (window as unknown as Record<string, unknown>).__setStoreState === 'function');
    await page.evaluate((userId) => {
      (window as unknown as { __setStoreState: (s: Record<string, unknown>) => void }).__setStoreState({ _userId: userId });
    }, TEST_USER_ID);
    await mock.waitForChannelsReady();

    // Act — inject a meals DELETE
    mock.injectMealDelete(PLAN_ID, { id: 'meal-to-delete', meal_plan_id: PLAN_ID });

    // Assert — meal card should disappear
    await expect(page.getByTestId('meal-meal-to-delete')).not.toBeVisible({ timeout: 5000 });
  });

  test('remote checked_items insert marks the item as checked with initials', async ({ page }) => {
    // Arrange — seed a custom shopping item with a known ID
    const customItemId = 'custom-rt-item-1';
    const mock = await setupRealtimeMock(page);
    await seedAndActivate(page, buildLocalStorageState([], {}, [
      { id: customItemId, ingredient: 'Realtime Test Item', quantity: 1, unit: 'pack', category: 'pantry' },
    ]));
    await page.goto('/shopping-list');
    await page.waitForSelector(`[data-testid="item-${customItemId}"]`);

    await page.waitForFunction(() => typeof (window as unknown as Record<string, unknown>).__setStoreState === 'function');
    await page.evaluate((userId) => {
      (window as unknown as { __setStoreState: (s: Record<string, unknown>) => void }).__setStoreState({ _userId: userId });
    }, TEST_USER_ID);
    await mock.waitForChannelsReady();

    // Confirm item starts unchecked (Checkbox component is a <button role="checkbox">)
    await expect(page.locator(`[data-testid="checkbox-${customItemId}"]`)).toHaveAttribute('aria-checked', 'false');

    // Act — another user checks the item
    mock.injectCheckedItemInsert(PLAN_ID, {
      item_id: customItemId,
      meal_plan_id: PLAN_ID,
      checked_by: OTHER_USER_ID,
      checked_by_email: 'alice@example.com',
    });

    // Assert — item is now checked and shows 'AL' initials
    await expect(page.locator(`[data-testid="checkbox-${customItemId}"]`)).toHaveAttribute('aria-checked', 'true', { timeout: 5000 });
    await expect(page.locator(`[data-testid="item-${customItemId}"]`)).toContainText('AL');
  });

  test('broadcast item_unchecked removes checked state from a shopping item', async ({ page }) => {
    // Arrange — seed a custom item that is already checked
    const customItemId = 'custom-rt-item-2';
    const mock = await setupRealtimeMock(page);
    await seedAndActivate(page, buildLocalStorageState([], { [customItemId]: 'alice@example.com' }, [
      { id: customItemId, ingredient: 'Broadcast Test Item', quantity: 1, unit: 'each', category: 'pantry' },
    ]));
    await page.goto('/shopping-list');
    await page.waitForSelector(`[data-testid="item-${customItemId}"]`);

    await page.waitForFunction(() => typeof (window as unknown as Record<string, unknown>).__setStoreState === 'function');
    await page.evaluate((userId) => {
      (window as unknown as { __setStoreState: (s: Record<string, unknown>) => void }).__setStoreState({ _userId: userId });
    }, TEST_USER_ID);
    await mock.waitForChannelsReady();

    // Confirm item starts checked (Checkbox component is a <button role="checkbox">)
    await expect(page.locator(`[data-testid="checkbox-${customItemId}"]`)).toHaveAttribute('aria-checked', 'true');

    // Act — inject broadcast item_unchecked
    mock.injectBroadcast(PLAN_ID, 'item_unchecked', { itemId: customItemId });

    // Assert — item is now unchecked
    await expect(page.locator(`[data-testid="checkbox-${customItemId}"]`)).toHaveAttribute('aria-checked', 'false', { timeout: 5000 });
  });

  test('broadcast clear_checked unchecks all items', async ({ page }) => {
    // Arrange — seed two custom items, both pre-checked
    const itemA = 'custom-rt-clear-a';
    const itemB = 'custom-rt-clear-b';
    const mock = await setupRealtimeMock(page);
    await seedAndActivate(page, buildLocalStorageState(
      [],
      { [itemA]: 'alice@example.com', [itemB]: 'bob@example.com' },
      [
        { id: itemA, ingredient: 'Clear Test A', quantity: 1, unit: 'each', category: 'pantry' },
        { id: itemB, ingredient: 'Clear Test B', quantity: 1, unit: 'each', category: 'pantry' },
      ],
    ));
    await page.goto('/shopping-list');
    await page.waitForSelector(`[data-testid="item-${itemA}"]`);

    await page.waitForFunction(() => typeof (window as unknown as Record<string, unknown>).__setStoreState === 'function');
    await page.evaluate((userId) => {
      (window as unknown as { __setStoreState: (s: Record<string, unknown>) => void }).__setStoreState({ _userId: userId });
    }, TEST_USER_ID);
    await mock.waitForChannelsReady();

    // Confirm both items start checked (Checkbox component is a <button role="checkbox">)
    await expect(page.locator(`[data-testid="checkbox-${itemA}"]`)).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator(`[data-testid="checkbox-${itemB}"]`)).toHaveAttribute('aria-checked', 'true');

    // Act — inject broadcast clear_checked
    mock.injectBroadcast(PLAN_ID, 'clear_checked', {});

    // Assert — both items are now unchecked
    await expect(page.locator(`[data-testid="checkbox-${itemA}"]`)).toHaveAttribute('aria-checked', 'false', { timeout: 5000 });
    await expect(page.locator(`[data-testid="checkbox-${itemB}"]`)).toHaveAttribute('aria-checked', 'false', { timeout: 5000 });
  });
});
