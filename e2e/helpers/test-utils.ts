import { Page } from '@playwright/test';

/**
 * Clear localStorage to reset app state
 */
export async function clearAppState(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
}

/**
 * Create a meal plan with default settings
 */
export async function createDefaultPlan(page: Page) {
  await page.goto('/plan');
  await page.getByTestId('generate-plan-btn').click();
  await page.waitForURL('/plan/current');
}
