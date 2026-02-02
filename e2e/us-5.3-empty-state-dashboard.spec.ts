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
 * - [ ] Clear "Create Your First Plan" button
 * - [ ] Brief explanation of what the app does
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

  test('Clear "Create Your First Plan" button', async ({ page }) => {
    const button = page.getByTestId('create-first-plan-btn');
    await expect(button).toBeVisible();
    await expect(button).toHaveText('Create Your First Plan');

    await button.click();
    await expect(page).toHaveURL('/plan');
  });

  test('Brief explanation of what the app does', async ({ page }) => {
    await expect(page.getByText('Plan your meals for the week')).toBeVisible();
    await expect(
      page.getByText('Generate a weekly meal plan, get recipes, and create a shopping list')
    ).toBeVisible();
  });

  test('Shows feature list', async ({ page }) => {
    await expect(page.getByText('Personalised meal plans based on your preferences')).toBeVisible();
    await expect(page.getByText('Auto-generated shopping lists grouped by aisle')).toBeVisible();
    await expect(page.getByText('Easy meal swapping when plans change')).toBeVisible();
  });
});
