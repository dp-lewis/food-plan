import { test, expect } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

/**
 * US-9.7: Join a shared plan as a new user (connected onboarding)
 *
 * As a person who has received a share link but doesn't have an account
 * I want to sign up or sign in and immediately join the plan
 * So that I don't lose the context of why I'm signing up or have to hunt for the link again
 *
 * Acceptance Criteria:
 * - [ ] Unauthenticated visitors on /shared/{code} see a clear "Join this plan" CTA
 * - [ ] The CTA explains that signing in or creating an account is required
 * - [ ] Clicking the CTA navigates to the sign-in page with the share code preserved
 * - [ ] After successful authentication, the user is redirected back to /shared/{code}
 * - [ ] On returning to the share page as an authenticated user, "Use This Plan" is shown
 * - [ ] The user completes the join with a single tap
 * - [ ] The ?next redirect is validated to only allow paths matching /shared/[code]
 * - [ ] If the share code is invalid or revoked a clear error is shown
 *
 * Note on auth-gated tests:
 * Tests that verify the full auth → redirect → join flow require a live Supabase
 * instance with a valid share code and a real OTP exchange. These are marked
 * test.skip and must be run manually or in a dedicated integration environment.
 */

const SHARE_CODE = 'test-share-abc123';

test.describe('US-9.7: Share onboarding flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  // -------------------------------------------------------------------------
  // Invalid share code (no auth required — server renders error state)
  // -------------------------------------------------------------------------

  test('invalid share code shows "Plan Not Found" error page', async ({ page }) => {
    await page.goto('/shared/this-code-does-not-exist');
    await expect(page.getByTestId('shared-plan-error')).toBeVisible();
    await expect(page.getByText('Plan Not Found')).toBeVisible();
    await expect(page.getByText('This shared plan link is invalid or has been revoked.')).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Sign-in page ?next param handling (no auth required)
  // -------------------------------------------------------------------------

  test('sign-in page renders correctly when ?next param is a valid share path', async ({ page }) => {
    await page.goto(`/auth/signin?next=/shared/${SHARE_CODE}`);
    // The form should render normally — ?next is purely metadata, no visible change
    await expect(page.getByTestId('signin-page')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('send-magic-link-btn')).toBeVisible();
  });

  test('sign-in page renders correctly when ?next param is an invalid/external URL', async ({ page }) => {
    // An open-redirect attempt — the app should silently discard the invalid next param
    // and render the sign-in form without error
    await page.goto('/auth/signin?next=https://evil.example.com/steal-cookies');
    await expect(page.getByTestId('signin-page')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    // The page must not redirect to the external URL on load
    expect(page.url()).toContain('/auth/signin');
  });

  test('sign-in page renders correctly when ?next param is a path traversal attempt', async ({ page }) => {
    await page.goto('/auth/signin?next=/../admin');
    await expect(page.getByTestId('signin-page')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    expect(page.url()).toContain('/auth/signin');
  });

  // -------------------------------------------------------------------------
  // Skipped — require a valid share code in Supabase + live auth
  // -------------------------------------------------------------------------

  test.skip('unauthenticated visitor on /shared/{code} sees "Join this plan" CTA', async ({ page }) => {
    // Requires a valid share code in Supabase (SHARE_CODE must exist in share_codes table)
    await page.goto(`/shared/${SHARE_CODE}`);
    await expect(page.getByTestId('shared-plan')).toBeVisible();
    await expect(page.getByTestId('join-plan-cta')).toBeVisible();
    await expect(page.getByText('Sign in to collaborate on this plan')).toBeVisible();
  });

  test.skip('join CTA button links to sign-in page with share code preserved', async ({ page }) => {
    // Requires a valid share code in Supabase
    await page.goto(`/shared/${SHARE_CODE}`);
    await expect(page.getByTestId('join-plan-signin-btn')).toBeVisible();

    const href = await page.getByTestId('join-plan-signin-btn').getAttribute('href');
    expect(href).toBe(`/auth/signin?next=/shared/${SHARE_CODE}`);
  });

  test.skip('clicking CTA navigates to sign-in page and preserves next param', async ({ page }) => {
    // Requires a valid share code in Supabase
    await page.goto(`/shared/${SHARE_CODE}`);
    await page.getByTestId('join-plan-signin-btn').click();

    await page.waitForURL(`/auth/signin?next=/shared/${SHARE_CODE}`);
    await expect(page.getByTestId('signin-page')).toBeVisible();
  });

  test.skip('after OTP verify with ?next, user is redirected to the share page', async ({ page }) => {
    // Requires live Supabase OTP flow:
    // 1. Navigate to /auth/signin?next=/shared/{code}
    // 2. Submit email, receive OTP
    // 3. Enter OTP — should redirect to /shared/{code} not /
    // 4. Shared plan page should show "Use This Plan" button (authenticated user)
    await page.goto(`/auth/signin?next=/shared/${SHARE_CODE}`);
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('send-magic-link-btn').click();
    await expect(page.getByTestId('signin-success')).toBeVisible();
    // Enter real OTP from email...
    await page.getByTestId('otp-input').fill('123456');
    await page.getByTestId('verify-btn').click();
    await page.waitForURL(`/shared/${SHARE_CODE}`);
    await expect(page.getByTestId('join-plan-btn')).toBeVisible();
  });

  test.skip('authenticated user on /shared/{code} sees "Use This Plan" button, not the sign-in CTA', async ({ page }) => {
    // Requires live auth — _userId must be set via real Supabase session
    // The join-plan-cta (unauthenticated state) must NOT be visible
    await page.goto(`/shared/${SHARE_CODE}`);
    await expect(page.getByTestId('join-plan-btn')).toBeVisible();
    await expect(page.getByTestId('join-plan-cta')).not.toBeVisible();
  });
});
