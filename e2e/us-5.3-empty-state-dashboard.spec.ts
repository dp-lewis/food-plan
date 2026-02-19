import { test, expect } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

/**
 * US-5.3: Empty state for new users
 *
 * As a first-time user
 * I want to see a clear call-to-action when I have no meal plan
 * So that I know how to get started
 *
 * Acceptance Criteria:
 * - [ ] Empty state shown when no plan exists
 * - [ ] Clear "Create Your Plan" button
 * - [ ] Brief explanation of what the app does
 * - [ ] Copy mentions sharing capability to set expectations for new users
 */

test.describe('US-5.3: Empty state for new users', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await page.reload();
  });

  test('Empty state shown when no plan exists', async ({ page }) => {
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('Clear "Create Your Plan" button', async ({ page }) => {
    const button = page.getByTestId('create-first-plan-btn');
    await expect(button).toBeVisible();
    await expect(button).toHaveText('Create Your Plan');

    await button.click();
    await expect(page).toHaveURL('/plan');
  });

  test('Brief explanation of what the app does', async ({ page }) => {
    await expect(page.getByText("What's for dinner this week?")).toBeVisible();
    await expect(
      page.getByText("Plan your week, share with your household, and check off the shopping together.")
    ).toBeVisible();
  });

  test('Empty state copy mentions sharing capability', async ({ page }) => {
    // M9 PR2 updated the tagline to highlight collaborative sharing
    await expect(page.getByText(/share with your household/i)).toBeVisible();
  });
});
