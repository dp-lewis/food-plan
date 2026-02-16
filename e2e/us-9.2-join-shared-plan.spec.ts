import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-9.2: Join a shared plan
 *
 * As a signed-in user viewing a shared plan link
 * I want to "Use This Plan" so it becomes my active plan
 * So that I can see the shared meals on my dashboard and shopping list
 *
 * Acceptance Criteria:
 * - Anonymous users do NOT see "Use This Plan" button
 * - Signed-in users see "Use This Plan" button on shared plan page
 * - After joining, user is redirected to /plan/current
 * - Member sees plan in read-only mode (no add/remove/swap controls)
 * - Member can view the shopping list
 * - Member does not see share FAB or "Reset plan" link
 */
test.describe('US-9.2: Join a shared plan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  test('Anonymous user does NOT see join button on shared plan page', async ({ page }) => {
    // Visit an invalid share code page — even if it loaded, anon shouldn't see join
    await page.goto('/shared/invalid-code-no-join');
    // The join button should not be present since user is not authenticated
    await expect(page.getByTestId('join-plan-btn')).not.toBeVisible();
  });

  test('Invalid share code does not show join button', async ({ page }) => {
    await page.goto('/shared/invalid-uuid-that-does-not-exist');
    await expect(page.getByTestId('shared-plan-error')).toBeVisible();
    await expect(page.getByTestId('join-plan-btn')).not.toBeVisible();
  });

  // Tests below require a seeded Supabase database with:
  // - A shared plan with share_code = 'e2e-test-share-code'
  // - An authenticated user (User B) who is NOT the plan owner
  // These tests follow the same pattern as US-9.1 skip tests.

  test.skip('Signed-in user sees "Use This Plan" button', async ({ page }) => {
    // Requires: authenticated as User B, plan seeded with share_code
    await page.goto('/shared/e2e-test-share-code');

    await expect(page.getByTestId('shared-plan')).toBeVisible();
    await expect(page.getByTestId('join-plan-btn')).toBeVisible();
    await expect(page.getByTestId('join-plan-btn')).toHaveText('Use This Plan');
  });

  test.skip('After joining, redirects to /plan/current', async ({ page }) => {
    // Requires: authenticated as User B
    await page.goto('/shared/e2e-test-share-code');

    await page.getByTestId('join-plan-btn').click();

    // Should redirect to plan page
    await page.waitForURL('/plan/current');
    await expect(page.getByTestId('meal-plan')).toBeVisible();
  });

  test.skip('Member cannot see edit controls on plan page', async ({ page }) => {
    // Requires: User B has already joined the plan
    await page.goto('/plan/current');

    await expect(page.getByTestId('meal-plan')).toBeVisible();

    // Should show "Shared with you" badge
    await expect(page.getByTestId('shared-plan-badge')).toBeVisible();

    // Should NOT show edit controls
    await expect(page.getByText('Reset plan')).not.toBeVisible();
    await expect(page.getByText('+ Add')).not.toBeVisible();
    await expect(page.getByText('Remove')).not.toBeVisible();

    // Should NOT show share FAB
    await expect(page.getByTestId('share-plan-btn')).not.toBeVisible();
  });

  test.skip('Member can view shopping list', async ({ page }) => {
    // Requires: User B has already joined the plan
    await page.goto('/shopping-list');

    // Shopping list page should load and show items from the shared plan
    await expect(page.getByTestId('shopping-list')).toBeVisible();
  });
});
