import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-9.5: Manage plan membership
 *
 * As a plan owner
 * I want to see who is on my plan and manage the share link
 * So that I stay in control of who can access and edit our meal plan
 *
 * Acceptance Criteria:
 * - [ ] Plan view shows members (avatars or names)
 * - [ ] Owner can revoke the share link (disables future joins)
 * - [ ] Owner can regenerate a new share link
 * - [ ] When owner deletes the plan, members see their dashboard update cleanly
 * - [ ] A member can leave a shared plan and return to "no plan" state
 * - [ ] Leaving does not affect the owner's plan or other members
 *
 * Note on auth-gated UI:
 * _planRole is set by StoreSync after a real Supabase sign-in. It is NOT
 * included in the `partialize` config and is therefore never written to
 * localStorage. Tests that depend on planRole === 'owner' or 'member' require
 * live auth and are marked test.skip.
 */
test.describe('US-9.5: Manage plan membership', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  test('Non-authenticated user sees Reset plan link but no Delete Plan or Leave Plan controls', async ({ page }) => {
    await createPlanWithMeals(page);

    // Plan page should be visible
    await expect(page.getByTestId('meal-plan')).toBeVisible();

    // Without auth planRole is null — the owner branch renders "Reset plan"
    await expect(page.getByText('Reset plan')).toBeVisible();

    // Delete Plan button only appears when planRole === 'owner' (requires auth)
    await expect(page.getByTestId('delete-plan-button')).not.toBeVisible();

    // Leave Plan button only appears when planRole === 'member' (requires auth)
    await expect(page.getByTestId('leave-plan-button')).not.toBeVisible();

    // "Shared with you" badge only appears when planRole === 'member'
    await expect(page.getByTestId('shared-plan-badge')).not.toBeVisible();
  });

  test('Non-authenticated user does not see share FAB', async ({ page }) => {
    await createPlanWithMeals(page);

    // The share FAB is only rendered in BottomNav when planRole === 'owner' && user.
    // Without auth, user is null so onShareClick is undefined and the FAB is hidden.
    await expect(page.getByTestId('share-plan-btn')).not.toBeVisible();
  });

  test.skip('Member sees Shared-with-you badge and Leave Plan button', async ({ page }) => {
    // Requires planRole=member set via live auth. planRole is not persisted to localStorage.
    await createPlanWithMeals(page);

    await expect(page.getByTestId('shared-plan-badge')).toBeVisible();
    await expect(page.getByTestId('shared-plan-badge')).toHaveText('Shared with you');
    await expect(page.getByTestId('leave-plan-button')).toBeVisible();

    // Member should NOT see Reset plan or Delete Plan
    await expect(page.getByText('Reset plan')).not.toBeVisible();
    await expect(page.getByTestId('delete-plan-button')).not.toBeVisible();
  });

  test.skip('Leave Plan drawer opens with confirmation text', async ({ page }) => {
    // Requires planRole=member set via live auth. planRole is not persisted to localStorage.
    await createPlanWithMeals(page);

    await page.getByTestId('leave-plan-button').click();

    // Drawer should open with the correct title and body copy
    await expect(page.getByText('Leave Plan')).toBeVisible();
    await expect(page.getByText("Leave this plan? You'll return to an empty plan.")).toBeVisible();
    await expect(page.getByTestId('confirm-leave-plan')).toBeVisible();
  });

  test.skip('Cancelling Leave Plan drawer dismisses without action', async ({ page }) => {
    // Requires planRole=member set via live auth. planRole is not persisted to localStorage.
    await createPlanWithMeals(page);

    await page.getByTestId('leave-plan-button').click();
    await expect(page.getByTestId('confirm-leave-plan')).toBeVisible();

    // Cancel — the drawer should close and the plan should still be visible
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByTestId('confirm-leave-plan')).not.toBeVisible();
    await expect(page.getByTestId('meal-plan')).toBeVisible();
  });

  test.skip('Owner sees Delete Plan button', async ({ page }) => {
    // Requires planRole=owner set via live auth. planRole is not persisted to localStorage.
    await createPlanWithMeals(page);

    await expect(page.getByTestId('delete-plan-button')).toBeVisible();

    // Owner should NOT see the Leave Plan button or "Shared with you" badge
    await expect(page.getByTestId('leave-plan-button')).not.toBeVisible();
    await expect(page.getByTestId('shared-plan-badge')).not.toBeVisible();
  });

  test.skip('Delete Plan drawer opens with warning text', async ({ page }) => {
    // Requires planRole=owner set via live auth. planRole is not persisted to localStorage.
    await createPlanWithMeals(page);

    await page.getByTestId('delete-plan-button').click();

    // Drawer should open with the correct title and destructive warning copy
    await expect(page.getByText('Delete Plan')).toBeVisible();
    await expect(page.getByText('Delete this plan? This is permanent and will remove it for all members.')).toBeVisible();
    await expect(page.getByTestId('confirm-delete-plan')).toBeVisible();
  });

  test.skip('Cancelling Delete Plan drawer dismisses without action', async ({ page }) => {
    // Requires planRole=owner set via live auth. planRole is not persisted to localStorage.
    await createPlanWithMeals(page);

    await page.getByTestId('delete-plan-button').click();
    await expect(page.getByTestId('confirm-delete-plan')).toBeVisible();

    // Cancel — the drawer should close and the plan should remain intact
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByTestId('confirm-delete-plan')).not.toBeVisible();
    await expect(page.getByTestId('meal-plan')).toBeVisible();
  });

  test.skip('Members row is shown when plan has 2+ members', async ({ page }) => {
    // Requires getPlanMembersAction which needs live auth.
    // PlanMembersRow is only rendered when members.length >= 2.
    // Seeding this state requires a real plan in Supabase with at least two members.
    await createPlanWithMeals(page);

    // With 2+ members the members row (avatars/emails) should be visible
    await expect(page.getByTestId('plan-members-row')).toBeVisible();
  });
});

test.describe('Reset plan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  test('Reset plan button is visible on plan page', async ({ page }) => {
    await createPlanWithMeals(page);
    await expect(page.getByText('Reset plan')).toBeVisible();
  });

  test('Reset plan drawer opens with correct content', async ({ page }) => {
    await createPlanWithMeals(page);
    await page.getByText('Reset plan').click();

    await expect(page.getByText('Reset Plan')).toBeVisible();
    await expect(page.getByText('This will clear all meals for everyone on this plan. The share link will stay active.')).toBeVisible();
    await expect(page.getByTestId('confirm-reset-plan')).toBeVisible();
  });

  test('Reset plan drawer shows day picker pre-filled with current start day', async ({ page }) => {
    await createPlanWithMeals(page, 5); // Saturday start
    await page.getByText('Reset plan').click();

    // Saturday (value "5") should be pre-selected
    await expect(page.getByTestId('reset-day-5')).toHaveAttribute('aria-pressed', 'true');
  });

  test('Reset plan drawer day picker can be changed', async ({ page }) => {
    await createPlanWithMeals(page, 5); // Saturday start
    await page.getByText('Reset plan').click();

    await page.getByTestId('reset-day-0').click();
    await expect(page.getByTestId('reset-day-0')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('reset-day-5')).toHaveAttribute('aria-pressed', 'false');
  });

  test('Cancelling Reset plan drawer dismisses without changing the plan', async ({ page }) => {
    await createPlanWithMeals(page);
    await page.getByText('Reset plan').click();

    await expect(page.getByTestId('confirm-reset-plan')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByTestId('confirm-reset-plan')).not.toBeVisible();
    await expect(page.getByTestId('meal-plan')).toBeVisible();
    // Meals should still be present (not wiped)
    await expect(page.getByText('No meals planned')).not.toBeVisible();
  });

  test.skip('Confirming reset clears all meals (requires auth)', async ({ page }) => {
    // resetPlanAction requires live Supabase auth — cannot run without sign-in
    await createPlanWithMeals(page);
    await page.getByText('Reset plan').click();
    await page.getByTestId('confirm-reset-plan').click();

    const emptySlots = page.getByText('No meals planned');
    await expect(emptySlots.first()).toBeVisible();
    expect(await emptySlots.count()).toBe(21);
  });

  test.skip('Confirming reset with changed start day updates the plan (requires auth)', async ({ page }) => {
    // resetPlanAction requires live Supabase auth — cannot run without sign-in
    await createPlanWithMeals(page, 5); // Saturday start
    await page.getByText('Reset plan').click();

    await page.getByTestId('reset-day-0').click(); // change to Monday
    await page.getByTestId('confirm-reset-plan').click();

    const firstDayCard = page.getByTestId('day-0');
    await expect(firstDayCard.getByText('Monday')).toBeVisible();
  });
});
