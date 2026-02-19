import { test, expect, Page } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

/**
 * Sign out flow tests
 *
 * Verifies the SignOutDialog component behavior when a user is signed in:
 * - Shows the user's email as a menu button
 * - Opens a confirmation drawer when clicked
 * - Allows canceling the sign-out operation
 * - Performs sign-out and navigates to home on confirmation
 * - Shows loading state during sign-out
 */

const SUPABASE_PROJECT_ID = 'fmsmgzfbudbcuafqpylo';
const AUTH_TOKEN_KEY = `sb-${SUPABASE_PROJECT_ID}-auth-token`;

/**
 * Sets up an authenticated session by:
 * 1. Mocking the Supabase user endpoint
 * 2. Injecting a fake session into localStorage
 * 3. Reloading the page so AuthProvider picks up the session
 */
async function setupAuthenticatedSession(page: Page) {
  const testEmail = 'test@example.com';
  const testUserId = 'fake-user-id';
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 3600;

  // Mock the Supabase user endpoint to return our test user
  await page.route('**/auth/v1/user*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: testUserId,
        email: testEmail,
        aud: 'authenticated',
        role: 'authenticated',
      }),
    });
  });

  // Navigate to home
  await page.goto('/');

  // Inject fake session into localStorage
  await page.evaluate(
    ({ key, email, userId, expires }) => {
      const session = {
        access_token: 'fake-access-token',
        refresh_token: 'fake-refresh-token',
        expires_at: expires,
        expires_in: 3600,
        token_type: 'bearer',
        user: {
          id: userId,
          email: email,
          aud: 'authenticated',
          role: 'authenticated',
        },
      };
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: AUTH_TOKEN_KEY, email: testEmail, userId: testUserId, expires: expiresAt }
  );

  // Reload so AuthProvider picks up the session
  await page.reload();

  // Wait for the user menu button to be visible (confirms auth loaded)
  await expect(page.getByTestId('user-menu-btn')).toBeVisible();
}

test.describe('Sign Out', () => {
  test.beforeEach(async ({ page }) => {
    await clearAppState(page);
    await setupAuthenticatedSession(page);
  });

  test('shows user email button when signed in', async ({ page }) => {
    const userMenuBtn = page.getByTestId('user-menu-btn');
    await expect(userMenuBtn).toBeVisible();
    await expect(userMenuBtn).toContainText('test@example.com');
  });

  test('opens sign-out confirmation drawer when email clicked', async ({ page }) => {
    await page.getByTestId('user-menu-btn').click();

    await expect(page.getByTestId('signout-confirmation-text')).toBeVisible();
    await expect(page.getByTestId('signout-cancel-btn')).toBeVisible();
    await expect(page.getByTestId('signout-confirm-btn')).toBeVisible();
  });

  test('Cancel button closes the confirmation drawer', async ({ page }) => {
    // Open the drawer
    await page.getByTestId('user-menu-btn').click();
    await expect(page.getByTestId('signout-confirmation-text')).toBeVisible();

    // Click cancel
    await page.getByTestId('signout-cancel-btn').click();

    // Drawer should be closed
    await expect(page.getByTestId('signout-confirmation-text')).not.toBeVisible();
    // User should still be signed in
    await expect(page.getByTestId('user-menu-btn')).toBeVisible();
  });

  test('confirming sign out navigates to home', async ({ page }) => {
    // Mock the sign-out endpoint
    await page.route('**/auth/signout', async (route) => {
      await route.fulfill({
        status: 303,
        headers: {
          Location: 'http://localhost:3000/',
        },
      });
    });

    // Open drawer and confirm sign-out
    await page.getByTestId('user-menu-btn').click();
    await page.getByTestId('signout-confirm-btn').click();

    // Should navigate to home
    await page.waitForURL('/');
  });

  test('confirm button shows loading state while signing out', async ({ page }) => {
    let fulfilled = false;

    // Mock the sign-out endpoint with a delay
    await page.route('**/auth/signout', async (route) => {
      // Wait 500ms before fulfilling to simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      fulfilled = true;
      await route.fulfill({
        status: 303,
        headers: {
          Location: 'http://localhost:3000/',
        },
      });
    });

    // Open drawer and click confirm
    await page.getByTestId('user-menu-btn').click();
    await page.getByTestId('signout-confirm-btn').click();

    // Immediately check for loading state (before the delay completes)
    await expect(page.getByTestId('signout-confirm-btn')).toContainText('Signing out');

    // Verify the request will eventually complete
    await page.waitForURL('/');
    expect(fulfilled).toBe(true);
  });
});
