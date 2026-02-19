import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-9.5: Manage plan membership
 *
 * As a plan owner
 * I want to manage who has access to my plan
 * So that I can share, revoke access, or remove the plan entirely
 *
 * Acceptance Criteria:
 * - [ ] Owner sees a Share button on the plan page (when signed in)
 * - [ ] Share drawer contains a copy link, regenerate link, and revoke link button
 * - [ ] Share drawer can be dismissed
 * - [ ] Member sees a Leave Plan button on the plan page
 * - [ ] Clicking Leave Plan opens a confirmation drawer
 * - [ ] After leaving, user is redirected to the empty dashboard
 * - [ ] Owner sees a Delete Plan button when signed in as owner
 * - [ ] Delete plan confirmation shows a destructive warning about all members
 * - [ ] Member avatars appear when 2 or more users are on the plan
 *
 * Note on auth-gated UI:
 * The Share FAB (share-plan-btn) is rendered by BottomNav only when
 * `planRole === 'owner' && user` — where `user` comes from a live Supabase
 * session. This cannot be seeded via localStorage. Similarly, `planRole` of
 * 'member' or 'owner' is set by StoreSync on sign-in. All share-drawer and
 * membership tests therefore require authenticated sessions and are skipped.
 */
test.describe('US-9.5: Manage plan membership', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  // ─── Tests requiring authentication (test.skip) ──────────────────────────

  // The share-plan-btn FAB only renders when planRole === 'owner' && user (from
  // Supabase auth). It cannot be triggered from a localStorage-seeded plan with
  // no active session. Requires a signed-in owner session to test.
  test.skip('Share button opens share drawer', async ({ page }) => {
    // Requires: signed in as plan owner (planRole === 'owner')
    await createPlanWithMeals(page);
    await expect(page.getByTestId('share-plan-btn')).toBeVisible();
    await page.getByTestId('share-plan-btn').click();
    await expect(page.getByTestId('share-drawer')).toBeVisible();
  });

  // Requires: signed in as plan owner so the share FAB and drawer are available.
  test.skip('Share drawer contains copy, regenerate, and revoke buttons', async ({ page }) => {
    // Requires: signed in as plan owner with an active share link already generated
    await page.goto('/plan/current');
    await page.getByTestId('share-plan-btn').click();
    await expect(page.getByTestId('share-drawer')).toBeVisible();
    await expect(page.getByTestId('copy-share-link')).toBeVisible();
    await expect(page.getByTestId('regenerate-share-link')).toBeVisible();
    await expect(page.getByTestId('revoke-share-link')).toBeVisible();
  });

  // Requires: signed in as plan owner so the share drawer is reachable.
  test.skip('Share drawer can be dismissed', async ({ page }) => {
    // Requires: signed in as plan owner
    await page.goto('/plan/current');
    await page.getByTestId('share-plan-btn').click();
    await expect(page.getByTestId('share-drawer')).toBeVisible();

    // Dismiss by pressing Escape
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('share-drawer')).not.toBeVisible();
  });

  // Requires: User B authenticated as a member of a shared plan.
  // planRole === 'member' is set by StoreSync on sign-in; not seedable via localStorage.
  test.skip('Member sees Leave Plan button', async ({ page }) => {
    // Requires: authenticated as User B (plan member)
    await page.goto('/plan/current');
    await expect(page.getByTestId('shared-plan-badge')).toBeVisible();
    await expect(page.getByTestId('leave-plan-button')).toBeVisible();
  });

  // Requires: authenticated as a plan member.
  test.skip('Leave plan confirmation drawer appears on click', async ({ page }) => {
    // Requires: authenticated as User B (plan member)
    await page.goto('/plan/current');
    await page.getByTestId('leave-plan-button').click();
    await expect(page.getByTestId('confirm-leave-plan')).toBeVisible();
  });

  // Requires: authenticated as a plan member + a live Supabase instance.
  test.skip('After leaving, redirected to empty dashboard', async ({ page }) => {
    // Requires: authenticated as User B (plan member)
    await page.goto('/plan/current');
    await page.getByTestId('leave-plan-button').click();
    await page.getByTestId('confirm-leave-plan').click();
    await page.waitForURL('/');
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  // Requires: signed in as plan owner (planRole === 'owner' set by server auth).
  test.skip('Owner sees Delete Plan button', async ({ page }) => {
    // Requires: authenticated as plan owner
    await page.goto('/plan/current');
    await expect(page.getByTestId('delete-plan-button')).toBeVisible();
  });

  // Requires: signed in as plan owner.
  test.skip('Delete plan confirmation shows destructive warning', async ({ page }) => {
    // Requires: authenticated as plan owner
    await page.goto('/plan/current');
    await page.getByTestId('delete-plan-button').click();
    await expect(page.getByTestId('confirm-delete-plan')).toBeVisible();
    // The drawer copy warns this action affects all members
    await expect(
      page.getByText('This is permanent and will remove it for all members.')
    ).toBeVisible();
  });

  // Requires: seeded Supabase plan with at least 2 joined members.
  // Members row only renders when members.length >= 2, and members are loaded
  // from the server via getPlanMembersAction which requires auth + a live DB.
  test.skip('Member avatars shown when 2+ users on plan', async ({ page }) => {
    // Requires: authenticated as owner, seeded plan with joined member in Supabase
    await page.goto('/plan/current');
    await expect(page.getByTestId('plan-members-row')).toBeVisible();
  });
});
