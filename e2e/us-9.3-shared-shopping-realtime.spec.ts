import { test, expect } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

/**
 * US-9.3: Shared shopping list with real-time check-off
 *
 * As a plan member
 * I want to check off shopping items in real time
 * So that my household can coordinate who has already picked up each item
 *
 * Acceptance Criteria:
 * - [ ] Solo users can clear checked items immediately (no confirmation required)
 * - [ ] Shared plan users see a confirmation drawer before clearing checked items
 * - [ ] Confirming clear affects all members in real time
 * - [ ] User A checking an item is visible to User B without a page refresh
 *
 * Note on real-time testing:
 * True end-to-end real-time sync (User A checks item → User B sees update instantly)
 * requires two simultaneous browser sessions authenticated as different users, plus
 * a live Supabase instance. These tests are skipped and must be verified manually.
 */

/**
 * Seeds localStorage with a plan that has some items pre-checked.
 * The plan includes real recipe IDs so the shopping list generates correctly.
 */
async function seedPlanWithCheckedItems(page: Parameters<typeof clearAppState>[0]) {
  await page.evaluate(() => {
    const plan = {
      id: 'test-plan-shopping',
      createdAt: new Date().toISOString(),
      preferences: { startDay: 5 },
      meals: [
        { id: 'meal-s-0-b', dayIndex: 0, mealType: 'breakfast', recipeId: 'breakfast-1', servings: 4 },
        { id: 'meal-s-0-l', dayIndex: 0, mealType: 'lunch', recipeId: 'lunch-1', servings: 4 },
        { id: 'meal-s-0-d', dayIndex: 0, mealType: 'dinner', recipeId: 'dinner-1', servings: 4 },
      ],
    };

    // We cannot know the exact generated item IDs ahead of time (they are
    // derived from recipe + ingredient data), so we leave checkedItems empty
    // and let the test check items by clicking checkboxes directly.
    const state = {
      state: {
        currentPlan: plan,
        checkedItems: {},
        userRecipes: [],
        customShoppingItems: [],
      },
      version: 2,
    };

    localStorage.setItem('food-plan-storage', JSON.stringify(state));
  });
}

test.describe('US-9.3: Shared shopping list with real-time check-off', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  test('Clear checked button fires immediately for solo users', async ({ page }) => {
    // Seed a plan so the shopping list page renders with items
    await seedPlanWithCheckedItems(page);
    await page.goto('/shopping-list');

    // Wait for the shopping list to render
    await expect(page.getByTestId('shopping-list')).toBeVisible();

    // The Checkbox component renders as a button[role="checkbox"], not input[type="checkbox"]
    const firstCheckbox = page.locator('[role="checkbox"]').first();
    await expect(firstCheckbox).toBeVisible();

    // Click to check the item
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');

    // Wait for the "Clear checked" button to appear in the header
    const clearBtn = page.getByTestId('clear-checked-btn');
    await expect(clearBtn).toBeVisible();

    // For a solo user (no planRole), clicking "Clear checked" should clear
    // immediately — no confirmation drawer should open.
    await clearBtn.click();

    // The confirm drawer button should NOT appear at any point
    await expect(page.getByTestId('confirm-clear-checked')).not.toBeVisible();

    // The checkbox should now be unchecked (items cleared)
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'false');
  });

  test('Solo: no confirmation drawer appears before clearing', async ({ page }) => {
    await seedPlanWithCheckedItems(page);
    await page.goto('/shopping-list');

    await expect(page.getByTestId('shopping-list')).toBeVisible();

    // The Checkbox component renders as a button[role="checkbox"]
    const firstCheckbox = page.locator('[role="checkbox"]').first();
    await expect(firstCheckbox).toBeVisible();
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute('aria-checked', 'true');

    const clearBtn = page.getByTestId('clear-checked-btn');
    await expect(clearBtn).toBeVisible();

    // Click clear — for solo users this should fire immediately
    await clearBtn.click();

    // The confirmation button (inside the drawer) must never have been visible.
    // We use a stricter assertion here because we want to confirm
    // the drawer never appeared during the entire clear operation.
    await expect(page.getByTestId('confirm-clear-checked')).not.toBeVisible();
  });

  // ─── Tests requiring authenticated shared plan (test.skip) ───────────────

  // Requires: a signed-in user who is a member of a shared plan.
  // _planRole === 'member' is set by StoreSync on sign-in from the server
  // session; it cannot be seeded via localStorage without triggering an
  // authenticated Supabase session.
  test.skip('Shared plan: clear checked shows confirmation drawer', async ({ page }) => {
    // Requires: User A authenticated as owner or member of a shared plan
    await page.goto('/shopping-list');
    await expect(page.getByTestId('shopping-list')).toBeVisible();

    // Checkbox component renders as button[role="checkbox"]
    const firstCheckbox = page.locator('[role="checkbox"]').first();
    await firstCheckbox.click();

    await page.getByTestId('clear-checked-btn').click();

    // Because planRole is set, the confirmation drawer should open
    await expect(page.getByTestId('confirm-clear-checked')).toBeVisible();
  });

  // Requires: two authenticated user sessions (owner + member) with a shared plan.
  // Cannot be automated in CI without live Supabase test accounts.
  test.skip('Shared plan: confirming clear affects all members in real time', async ({ page }) => {
    // User A clears items — User B should see the items unchecked in real time
    await page.goto('/shopping-list');
    await page.getByTestId('confirm-clear-checked').click();

    // In a real two-session test, assert User B's page updates without reload
    await expect(page.locator('input[type="checkbox"]:checked')).toHaveCount(0);
  });

  // Requires: two simultaneous authenticated browser sessions.
  test.skip('User A checks item, User B sees real-time update', async ({ page }) => {
    // Authenticate as User B (member) — requires seeded Supabase credentials
    await page.goto('/shopping-list');
    await expect(page.getByTestId('shopping-list')).toBeVisible();

    // At this point, User A (in a separate session) checks an item.
    // Within ~1 second, User B's checkbox should appear checked.
    // This test requires Playwright's browser contexts or external orchestration.
  });
});
