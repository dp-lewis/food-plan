import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-9.6: Use the app offline
 *
 * As a grocery shopper in a supermarket with patchy connectivity
 * I want to check off items and make plan changes even when offline
 * So that I don't lose my work when my signal drops
 *
 * Acceptance Criteria:
 * - [ ] When offline, a clear indicator is shown ("You're offline")
 * - [ ] Shopping item check-offs still work offline (optimistic local update)
 * - [ ] Changes made while offline are queued and synced automatically when back online
 * - [ ] No data is lost during the offline period
 * - [ ] When reconnected, the indicator disappears and changes sync without user action
 * - [ ] Checked state from localStorage is shown when offline (last known state)
 *
 * Offline simulation:
 * To simulate going offline in Playwright use:
 *   await page.context().setOffline(true);
 *   await page.evaluate(() => window.dispatchEvent(new Event('offline')));
 * To restore connectivity:
 *   await page.context().setOffline(false);
 *   await page.evaluate(() => window.dispatchEvent(new Event('online')));
 *
 * The OfflineBanner component reads _isOnline from the Zustand store, which is
 * driven by the 'online'/'offline' window events listened to by useOnlineSync.
 * Dispatching the events manually keeps the store in sync with the simulated
 * network state.
 */
test.describe('US-9.6: Use the app offline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  test('Offline banner is not shown when app is online', async ({ page }) => {
    await page.goto('/shopping-list');

    // The app starts online — the banner should not be rendered
    await expect(page.getByTestId('offline-banner')).not.toBeVisible();
  });

  test("Offline banner appears when network goes offline", async ({ page }) => {
    await page.goto('/shopping-list');

    // Simulate going offline: cut network then fire the window event so
    // useOnlineSync updates _isOnline in the Zustand store
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    // Banner should now be visible with the correct copy
    const banner = page.getByTestId('offline-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("You're offline");

    // Restore online state for subsequent tests
    await page.context().setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
  });

  test('Offline banner disappears when network reconnects', async ({ page }) => {
    await page.goto('/shopping-list');

    // Go offline
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await expect(page.getByTestId('offline-banner')).toBeVisible();

    // Reconnect
    await page.context().setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    // Banner should be gone
    await expect(page.getByTestId('offline-banner')).not.toBeVisible();
  });

  test('Shopping items can be checked while offline', async ({ page }) => {
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');

    // Wait for the shopping list to fully render before going offline
    await expect(page.getByTestId('shopping-list')).toBeVisible();
    const firstItemCheckbox = page.locator('[data-testid^="item-"]').first().getByRole('checkbox');
    await expect(firstItemCheckbox).toBeVisible();

    // Go offline
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    // Give the store a moment to reflect the new offline state
    await page.waitForTimeout(200);

    // Checking an item should still work (optimistic local update)
    await firstItemCheckbox.click();
    await expect(firstItemCheckbox).toBeChecked();

    // Restore online state
    await page.context().setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
  });

  test('Offline banner shows correct accessible attributes', async ({ page }) => {
    await page.goto('/shopping-list');

    // Go offline to render the banner
    await page.context().setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    const banner = page.getByTestId('offline-banner');
    await expect(banner).toBeVisible();

    // The banner must carry the correct ARIA attributes for screen readers
    await expect(banner).toHaveAttribute('role', 'status');
    await expect(banner).toHaveAttribute('aria-live', 'polite');

    // Restore online state
    await page.context().setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
  });
});
