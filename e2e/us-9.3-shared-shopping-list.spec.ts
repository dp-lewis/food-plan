import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-9.3: Shared shopping list with real-time check-off
 *
 * As a family member on a shared plan
 * I want to check off shopping items and see my partner's check-offs appear in real time
 * So that we don't double-buy items when shopping separately
 *
 * Acceptance Criteria:
 * - [ ] Both owner and members can check and uncheck shopping items
 * - [ ] When one user checks an item, the other sees it update within a few seconds
 * - [ ] Checked state persists across page refreshes
 * - [ ] Shows who checked each item (initials or name)
 * - [ ] "Clear checked" affects everyone on the plan
 * - [ ] Custom shopping items are visible to all plan members
 *
 * Note on real-time testing:
 * Acceptance criteria that require two simultaneous authenticated sessions
 * (e.g. real-time propagation between two users) cannot be automated in CI
 * without live Supabase credentials and seeded test accounts. Those scenarios
 * are covered by manual verification and are marked test.skip below.
 */
test.describe('US-9.3: Shared shopping list with real-time check-off', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  test('Clear checked button is hidden when no items are checked', async ({ page }) => {
    // Seed a plan with no checked items and navigate to the shopping list
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');
    await expect(page.getByTestId('shopping-list')).toBeVisible();

    // With checkedCount === 0 the button should not be rendered at all
    await expect(page.getByTestId('clear-checked-btn')).not.toBeVisible();
  });

  test('Clear checked button appears after checking an item', async ({ page }) => {
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');
    await expect(page.getByTestId('shopping-list')).toBeVisible();

    // Find the checkbox inside the first item li and click it
    const firstItemCheckbox = page.locator('[data-testid^="item-"]').first().getByRole('checkbox');
    await firstItemCheckbox.click();

    // checkedCount is now 1 — the "Clear checked" button should appear
    await expect(page.getByTestId('clear-checked-btn')).toBeVisible();
  });

  test('Solo user (no planRole): Clear checked clears items immediately without a confirmation drawer', async ({ page }) => {
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');
    await expect(page.getByTestId('shopping-list')).toBeVisible();

    // Check the first item to make checkedCount > 0
    const firstItemCheckbox = page.locator('[data-testid^="item-"]').first().getByRole('checkbox');
    await firstItemCheckbox.click();
    await expect(page.getByTestId('clear-checked-btn')).toBeVisible();

    // Click "Clear checked" — planRole is null so it should clear immediately,
    // with no confirmation drawer appearing
    await page.getByTestId('clear-checked-btn').click();

    // No confirmation drawer should have appeared (confirm button never rendered)
    await expect(page.getByTestId('confirm-clear-checked')).not.toBeVisible();

    // checkedCount is now 0, so the "Clear checked" button should be gone
    await expect(page.getByTestId('clear-checked-btn')).not.toBeVisible();

    // The first item's checkbox should be unchecked
    await expect(firstItemCheckbox).not.toBeChecked();
  });

  // planRole is set via live auth by StoreSync — it is not persisted to localStorage
  // and cannot be seeded in a test without a real Supabase sign-in.
  test.skip('Shared plan user: Clear checked opens confirmation drawer', async ({ page }) => {
    // Requires planRole set via live auth. planRole is not persisted to localStorage.
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');

    const firstItemCheckbox = page.locator('[data-testid^="item-"]').first().getByRole('checkbox');
    await firstItemCheckbox.click();
    await page.getByTestId('clear-checked-btn').click();

    // With planRole set the click should open the confirmation drawer, not clear immediately
    await expect(page.getByText('Clear all checked items?')).toBeVisible();
    await expect(page.getByTestId('confirm-clear-checked')).toBeVisible();
  });

  test.skip('Confirming clear removes all checked items for everyone', async ({ page }) => {
    // Requires planRole set via live auth. planRole is not persisted to localStorage.
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');

    const firstItemCheckbox = page.locator('[data-testid^="item-"]').first().getByRole('checkbox');
    await firstItemCheckbox.click();
    await page.getByTestId('clear-checked-btn').click();

    // Confirm the clear action
    await page.getByTestId('confirm-clear-checked').click();

    // All items should now be unchecked and the button gone
    await expect(page.getByTestId('clear-checked-btn')).not.toBeVisible();
  });

  test.skip('Cancelling clear drawer keeps items checked', async ({ page }) => {
    // Requires planRole set via live auth. planRole is not persisted to localStorage.
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');

    const firstItemCheckbox = page.locator('[data-testid^="item-"]').first().getByRole('checkbox');
    await firstItemCheckbox.click();
    await page.getByTestId('clear-checked-btn').click();

    // Cancel the drawer
    await page.getByRole('button', { name: 'Cancel' }).click();

    // The clear button should still be visible (items still checked)
    await expect(page.getByTestId('clear-checked-btn')).toBeVisible();
    // The item should still be checked
    await expect(firstItemCheckbox).toBeChecked();
  });

  test.skip('Checked item shows "you" label when checked by current user', async ({ page }) => {
    // Requires _userEmail set via live auth. _userEmail is not persisted to localStorage.
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');

    const firstItemCheckbox = page.locator('[data-testid^="item-"]').first().getByRole('checkbox');
    await firstItemCheckbox.click();

    // The item should display "you" when checked by the currently signed-in user
    const firstItem = page.locator('[data-testid^="item-"]').first();
    await expect(firstItem.getByText('you')).toBeVisible();
  });

  test.skip('Checked item shows initials when checked by another user', async ({ page }) => {
    // Requires _userEmail set via live auth. _userEmail is not persisted to localStorage.
    // Seed checkedItems with an email that differs from the signed-in user's email so
    // that initials (not "you") are shown.
    await createPlanWithMeals(page);
    await page.goto('/shopping-list');

    // The first item's li should display the other user's initials (e.g. "JD" for
    // jane.doe@example.com) rather than "you"
    const firstItem = page.locator('[data-testid^="item-"]').first();
    await expect(firstItem.locator('span.rounded-full')).toBeVisible();
  });
});
