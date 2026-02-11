import { test, expect } from '@playwright/test';
import { clearAppState } from './helpers/test-utils';

/**
 * US-1.1: Create a new meal plan
 *
 * As a family meal planner
 * I want to start a weekly meal plan choosing my start day
 * So that my week aligns with when I do my shopping
 *
 * Acceptance Criteria:
 * - [ ] Can pick a start day (Mon-Sun, default: Saturday)
 * - [ ] Clicking "Start Planning" creates an empty 7-day plan
 * - [ ] Plan is saved to localStorage
 * - [ ] Redirects to plan view after creation
 * - [ ] Plan view shows all 7 days with 3 meal slots each
 */

test.describe('US-1.1: Create a new meal plan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await page.goto('/plan');
  });

  test('Can pick a start day (default: Saturday)', async ({ page }) => {
    // Saturday (value "5") should be selected by default
    await expect(page.getByTestId('day-5')).toHaveAttribute('aria-pressed', 'true');

    // Can change to Monday
    await page.getByTestId('day-0').click();
    await expect(page.getByTestId('day-0')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('day-5')).toHaveAttribute('aria-pressed', 'false');
  });

  test('Clicking "Start Planning" creates an empty plan', async ({ page }) => {
    await page.getByTestId('generate-plan-btn').click();
    await page.waitForURL('/plan/current');

    // Wait for hydration, then verify all slots show "No meals planned"
    const emptySlots = page.getByText('No meals planned');
    await expect(emptySlots.first()).toBeVisible();
    // 7 days × 3 slots = 21 empty slots
    expect(await emptySlots.count()).toBe(21);
  });

  test('Plan is saved to localStorage', async ({ page }) => {
    await page.getByTestId('generate-plan-btn').click();
    await page.waitForURL('/plan/current');

    const storage = await page.evaluate(() => localStorage.getItem('food-plan-storage'));
    expect(storage).not.toBeNull();

    const parsed = JSON.parse(storage!);
    expect(parsed.state.currentPlan).not.toBeNull();
    expect(parsed.state.currentPlan.preferences.startDay).toBe(5);
  });

  test('Redirects to plan view after creation', async ({ page }) => {
    await page.getByTestId('generate-plan-btn').click();
    await expect(page).toHaveURL('/plan/current');
    await expect(page.getByTestId('meal-plan')).toBeVisible();
  });

  test('Plan view shows 7 days with 3 meal slots each', async ({ page }) => {
    await page.getByTestId('generate-plan-btn').click();
    await page.waitForURL('/plan/current');

    // All 7 days visible
    for (let i = 0; i < 7; i++) {
      await expect(page.getByTestId(`day-${i}`)).toBeVisible();
    }

    // Each day has breakfast, lunch, dinner slots
    for (let i = 0; i < 7; i++) {
      await expect(page.getByTestId(`slot-${i}-breakfast`)).toBeVisible();
      await expect(page.getByTestId(`slot-${i}-lunch`)).toBeVisible();
      await expect(page.getByTestId(`slot-${i}-dinner`)).toBeVisible();
    }
  });

  test('Start day changes the day order in plan view', async ({ page }) => {
    // Pick Monday as start day
    await page.getByTestId('day-0').click();
    await page.getByTestId('generate-plan-btn').click();
    await page.waitForURL('/plan/current');

    // First day card should say Monday
    const firstDayCard = page.getByTestId('day-0');
    await expect(firstDayCard.getByText('Monday')).toBeVisible();

    // Go back and create a Wednesday plan
    await clearAppState(page);
    await page.goto('/plan');
    await page.getByTestId('day-2').click();
    await page.getByTestId('generate-plan-btn').click();
    await page.waitForURL('/plan/current');

    // First day card should say Wednesday
    const firstDayCardWed = page.getByTestId('day-0');
    await expect(firstDayCardWed.getByText('Wednesday')).toBeVisible();
  });
});
