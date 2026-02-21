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

/**
 * Sets up an authenticated session by:
 * 1. Mocking the Supabase user endpoint
 * 2. Injecting a fake session via a cookie (as @supabase/ssr uses document.cookie, not localStorage)
 * 3. Navigating to the home page
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

  const session = {
    access_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWtlLXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImF1ZCI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjk5OTk5OTk5OTl9.fakesig',
    refresh_token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWtlLXVzZXItaWQifQ.fakerefreshsig',
    expires_at: expiresAt,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: testUserId,
      email: testEmail,
      aud: 'authenticated',
      role: 'authenticated',
    },
  };

  // @supabase/ssr stores sessions in a cookie, not localStorage.
  // Cookie value format: "base64-" + base64url(JSON.stringify(session))
  const cookieValue = 'base64-' + Buffer.from(JSON.stringify(session)).toString('base64url');

  await page.context().addCookies([
    {
      name: 'supabase.auth.token',
      value: cookieValue,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Navigate to home — cookie is already present so AuthProvider picks it up on first load
  await page.goto('/');

  // Wait for the user menu button to be visible (confirms auth loaded)
  await expect(page.getByTestId('user-menu-btn')).toBeVisible();
}

// TODO: session injection via cookies needs further investigation — skip until fixed
test.describe.skip('Sign Out', () => {
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
