import { test, expect } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

test.describe('US-5.3: Empty state dashboard for new users', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await page.reload();
  });

  test('shows empty state when no plan exists', async ({ page }) => {
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('displays heading and description', async ({ page }) => {
    await expect(page.getByText('Plan your meals for the week')).toBeVisible();
    await expect(
      page.getByText('Generate a weekly meal plan, get recipes, and create a shopping list')
    ).toBeVisible();
  });

  test('has "Create Your First Plan" button that links to /plan', async ({ page }) => {
    const button = page.getByTestId('create-first-plan-btn');
    await expect(button).toBeVisible();
    await expect(button).toHaveText('Create Your First Plan');

    await button.click();
    await expect(page).toHaveURL('/plan');
  });

  test('displays feature list with checkmarks', async ({ page }) => {
    await expect(page.getByText('Personalised meal plans based on your preferences')).toBeVisible();
    await expect(page.getByText('Auto-generated shopping lists grouped by aisle')).toBeVisible();
    await expect(page.getByText('Easy meal swapping when plans change')).toBeVisible();
  });
});
