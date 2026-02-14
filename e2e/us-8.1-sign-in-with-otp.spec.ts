import { test, expect } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

/**
 * US-8.1: Sign in with OTP code (PWA-compatible)
 *
 * As a PWA user on iOS
 * I want to sign in using a 6-digit code from my email
 * So that I can authenticate directly in the installed app without being redirected to Safari
 *
 * Acceptance Criteria:
 * - [ ] Can enter email and request a sign-in code
 * - [ ] After requesting, sees a 6-digit code input form
 * - [ ] Can enter the 6-digit code and verify to sign in
 * - [ ] Shows error message if verification fails
 * - [ ] Can resend the code by going back to the email form
 * - [ ] Magic link in the email still works for browser users
 */

test.describe('US-8.1: Sign in with OTP code', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  test('Can enter email and request a sign-in code', async ({ page }) => {
    // Mock the Supabase OTP endpoint
    await page.route('**/auth/v1/otp*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/auth/signin');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('send-magic-link-btn').click();

    // Should transition to the OTP entry view
    await expect(page.getByTestId('signin-success')).toBeVisible();
  });

  test('After requesting, sees a 6-digit code input form', async ({ page }) => {
    await page.route('**/auth/v1/otp*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/auth/signin');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('send-magic-link-btn').click();

    await expect(page.getByTestId('otp-input')).toBeVisible();
    await expect(page.getByTestId('verify-btn')).toBeVisible();
    await expect(page.getByText('Enter the 6-digit code')).toBeVisible();
  });

  test('Can enter the 6-digit code and verify to sign in', async ({ page }) => {
    await page.route('**/auth/v1/otp*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    // Mock the verify endpoint to return a successful session
    await page.route('**/auth/v1/verify*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
            aud: 'authenticated',
            role: 'authenticated',
          },
        }),
      });
    });

    await page.goto('/auth/signin');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('send-magic-link-btn').click();

    await page.getByTestId('otp-input').fill('123456');
    await expect(page.getByTestId('verify-btn')).toBeEnabled();
    await page.getByTestId('verify-btn').click();

    // Should redirect to home after successful verification
    await page.waitForURL('/');
  });

  test('Verify button is disabled until 6 digits entered', async ({ page }) => {
    await page.route('**/auth/v1/otp*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/auth/signin');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('send-magic-link-btn').click();

    // Initially disabled
    await expect(page.getByTestId('verify-btn')).toBeDisabled();

    // Partially filled - still disabled
    await page.getByTestId('otp-input').fill('123');
    await expect(page.getByTestId('verify-btn')).toBeDisabled();

    // Fully filled - enabled
    await page.getByTestId('otp-input').fill('123456');
    await expect(page.getByTestId('verify-btn')).toBeEnabled();
  });

  test('Shows error message if verification fails', async ({ page }) => {
    await page.route('**/auth/v1/otp*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    // Mock verify endpoint to return an error
    await page.route('**/auth/v1/verify*', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'otp_expired',
          error_description: 'Token has expired or is invalid',
        }),
      });
    });

    await page.goto('/auth/signin');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('send-magic-link-btn').click();

    await page.getByTestId('otp-input').fill('000000');
    await page.getByTestId('verify-btn').click();

    // Should show error alert
    await expect(page.locator('p[role="alert"]')).toBeVisible();
  });

  test('Can resend the code by going back to the email form', async ({ page }) => {
    await page.route('**/auth/v1/otp*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/auth/signin');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('send-magic-link-btn').click();

    // Should be on OTP view
    await expect(page.getByTestId('otp-input')).toBeVisible();

    // Click resend
    await page.getByTestId('resend-btn').click();

    // Should be back to email form
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('send-magic-link-btn')).toBeVisible();
  });
});
