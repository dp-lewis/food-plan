import { test, expect } from '@playwright/test';
import { clearAppState, createDefaultPlan } from './helpers/test-utils';

/**
 * US-3.1: View recipe details
 *
 * As a home cook
 * I want to see full recipe details including ingredients and steps
 * So that I can prepare the meal
 *
 * Acceptance Criteria:
 * - [ ] Shows recipe title
 * - [ ] Shows prep time and cook time
 * - [ ] Shows number of servings
 * - [ ] Shows difficulty level
 * - [ ] Shows list of ingredients with quantities
 * - [ ] Shows step-by-step instructions
 * - [ ] Shows estimated cost (low/medium/high)
 */

test.describe('US-3.1: View recipe details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createDefaultPlan(page);
  });

  test('Shows recipe title', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    const title = page.getByTestId('recipe-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText!.length).toBeGreaterThan(0);
  });

  test('Shows prep time and cook time', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    const timeElement = page.getByTestId('recipe-time');
    await expect(timeElement).toBeVisible();
    await expect(timeElement).toContainText('mins');
  });

  test('Shows number of servings', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    const servingsElement = page.getByTestId('recipe-servings');
    await expect(servingsElement).toBeVisible();
    await expect(servingsElement).toContainText('Servings');
  });

  test('Shows difficulty level', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    await expect(page.getByText('Difficulty')).toBeVisible();
  });

  test('Shows list of ingredients with quantities', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    const ingredientsList = page.getByTestId('ingredients-list');
    await expect(ingredientsList).toBeVisible();

    const items = ingredientsList.locator('li');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Shows step-by-step instructions', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    const instructionsList = page.getByTestId('instructions-list');
    await expect(instructionsList).toBeVisible();

    const steps = instructionsList.locator('li');
    const count = await steps.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Shows estimated cost (low/medium/high)', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();

    await expect(page.getByText('Cost')).toBeVisible();
  });

  test('Can navigate back to the calendar from recipe view', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    await firstDay.locator('[data-testid^="meal-"]').first().locator('a').click();
    await expect(page.getByTestId('recipe-page')).toBeVisible();

    await page.getByTestId('bottom-nav-back').click();

    await expect(page.getByTestId('meal-plan')).toBeVisible();
  });
});
