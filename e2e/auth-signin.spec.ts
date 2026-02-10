import { test, expect } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

test.describe('Auth Sign-in Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
  });

  test('sign-in page renders with email input and submit button', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByTestId('signin-page')).toBeVisible();
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('send-magic-link-btn')).toBeVisible();
  });

  test('dashboard shows sign-in link when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('sign-in-link')).toBeVisible();
  });

  test('sign-in link navigates to sign-in page', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('sign-in-link').click();
    await page.waitForURL('/auth/signin');
    await expect(page.getByTestId('signin-page')).toBeVisible();
  });

  test('BottomNav back button returns to dashboard from sign-in', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.getByTestId('signin-page').waitFor();
    await page.getByTestId('bottom-nav-back').click();
    await page.waitForURL('/');
  });
});
