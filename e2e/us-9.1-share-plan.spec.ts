import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-9.1: Share a meal plan via link
 *
 * As a family meal planner
 * I want to share my meal plan via a link
 * So that my partner or family members can see what's planned for the week
 *
 * Acceptance Criteria:
 * - Share button visible on plan view for signed-in users
 * - Share button NOT visible for anonymous users
 * - Clicking Share copies a shareable link to clipboard
 * - Shared link shows the meal plan read-only (no edit controls)
 * - Shared link shows the shopping list read-only (no checkboxes)
 * - Invalid or revoked share links show an error message
 * - Sharing the same plan again returns the same link (idempotent)
 * - Shared view works for unauthenticated visitors
 */
test.describe('US-9.1: Share a meal plan via link', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  test.skip('Share button is not visible for anonymous users', async ({ page }) => {
    // Create a plan via localStorage (no auth)
    await createPlanWithMeals(page);
    // The share button should not be present for unauthenticated users
    await expect(page.getByTestId('share-plan-btn')).not.toBeVisible();
  });

  test('Invalid share code shows error state', async ({ page }) => {
    await page.goto('/shared/invalid-uuid-that-does-not-exist');
    await expect(page.getByTestId('shared-plan-error')).toBeVisible();
    await expect(page.getByText('This shared plan link is invalid or has been revoked')).toBeVisible();
  });

  // Tests below require a seeded Supabase database with a shared plan.
  // page.route() cannot intercept server-side fetches (the shared page is
  // a server component). These tests will work once the migration is applied
  // and a test plan is seeded with: share_code = 'e2e-test-share-code'.

  test.skip('Shared plan displays meal calendar read-only', async ({ page }) => {
    await page.goto('/shared/e2e-test-share-code');

    // Should show the shared plan view
    await expect(page.getByTestId('shared-plan')).toBeVisible();
    await expect(page.getByText('Shared Meal Plan')).toBeVisible();

    // Should show day cards with recipe names
    await expect(page.getByTestId('day-0')).toBeVisible();

    // Should NOT have edit controls
    await expect(page.getByText('Remove')).not.toBeVisible();
    await expect(page.getByText('+ Add')).not.toBeVisible();
    await expect(page.getByText('Swap')).not.toBeVisible();
  });

  test.skip('Shared plan displays shopping list read-only', async ({ page }) => {
    await page.goto('/shared/e2e-test-share-code');

    // Shopping list should be visible (generated from built-in recipes)
    await expect(page.getByTestId('shared-shopping-list')).toBeVisible();
    await expect(page.getByText('Shopping List')).toBeVisible();

    // Should NOT have checkboxes or add button
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
    await expect(page.getByTestId('open-add-drawer-btn')).not.toBeVisible();
  });

  test.skip('Shared view shows custom shopping items', async ({ page }) => {
    await page.goto('/shared/e2e-test-share-code');

    await expect(page.getByTestId('shared-shopping-list')).toBeVisible();
    // Custom items from the seeded plan should appear
    await expect(page.getByText('Paper Towels')).toBeVisible();
  });
});
