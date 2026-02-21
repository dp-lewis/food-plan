import { test, expect } from '@playwright/test';
import { clearAppState, createPlanWithMeals } from './helpers/test-utils';

/**
 * US-2.3: Manage meals in plan
 *
 * As a family meal planner
 * I want to add and remove meals from any slot
 * So that I can customise the plan for fussy eaters or eating out
 *
 * Acceptance Criteria:
 * - [ ] Each meal has a "Remove" button
 * - [ ] Each slot has an "Add" button that opens recipe drawer
 * - [ ] Can add multiple meals to the same slot
 * - [ ] Can remove all meals from a slot (empty slot is valid)
 * - [ ] Adding a meal opens drawer filtered by meal type
 * - [ ] Can use "Surprise me" when adding a meal
 * - [ ] Changes are saved to localStorage
 * - [ ] Can dismiss drawer without making changes
 */

test.describe('US-2.3: Manage meals in plan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAppState(page);
    await createPlanWithMeals(page);
  });

  test('Each meal has a "Remove" button', async ({ page }) => {
    const removeButtons = page.locator('[data-testid^="remove-meal-"]');
    const count = await removeButtons.count();
    expect(count).toBeGreaterThan(0);

    const firstRemove = removeButtons.first();
    await expect(firstRemove).toBeVisible();
    await expect(firstRemove).toHaveText('Remove');
  });

  test('Each slot has an "Add" button that opens recipe drawer', async ({ page }) => {
    // Find add buttons for day 0
    const addButtons = page.locator('[data-testid^="add-meal-0-"]');
    const count = await addButtons.count();
    expect(count).toBeGreaterThan(0);

    const firstAdd = addButtons.first();
    await expect(firstAdd).toBeVisible();
    await firstAdd.click();

    // Drawer should be visible
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();

    // Should have recipe options
    const recipeList = page.getByTestId('recipe-drawer-list');
    await expect(recipeList).toBeVisible();

    // Should have surprise me button
    const surpriseBtn = page.getByTestId('surprise-me-btn');
    await expect(surpriseBtn).toBeVisible();
  });

  test('Can add multiple meals to the same slot', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const slot = firstDay.locator('[data-testid="slot-0-breakfast"]');

    // Count initial meals in the breakfast slot
    const initialMeals = await slot.locator('[data-testid^="meal-"]').count();

    // Click add button for breakfast
    const addButton = slot.locator('[data-testid="add-meal-0-breakfast"]');
    await addButton.click();

    // Wait for drawer
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Select a recipe (first available that's not already in the slot)
    const recipeOptions = page.locator('[data-testid^="recipe-option-"]:not([disabled])');
    await recipeOptions.first().click();

    // Drawer should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Should have one more meal
    const newMealCount = await slot.locator('[data-testid^="meal-"]').count();
    expect(newMealCount).toBe(initialMeals + 1);
  });

  test('Can remove all meals from a slot (empty slot is valid)', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const slot = firstDay.locator('[data-testid="slot-0-breakfast"]');

    // Get all remove buttons in the slot
    const removeButtons = slot.locator('[data-testid^="remove-meal-"]');
    const count = await removeButtons.count();

    // Remove all meals from the slot
    for (let i = 0; i < count; i++) {
      // Always click the first one since they shift after removal
      await slot.locator('[data-testid^="remove-meal-"]').first().click();
    }

    // Should show "No meals planned"
    await expect(slot.getByText('No meals planned')).toBeVisible();

    // Should still have an add button
    await expect(slot.locator('[data-testid="add-meal-0-breakfast"]')).toBeVisible();
  });

  test('Can use "Surprise me" when adding a meal', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const slot = firstDay.locator('[data-testid="slot-0-breakfast"]');

    const initialMeals = await slot.locator('[data-testid^="meal-"]').count();

    const addButton = slot.locator('[data-testid="add-meal-0-breakfast"]');
    await addButton.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Click surprise me
    await page.getByTestId('surprise-me-btn').click();

    // Drawer should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Should have one more meal
    const newMealCount = await slot.locator('[data-testid^="meal-"]').count();
    expect(newMealCount).toBe(initialMeals + 1);
  });

  test('Changes are saved to localStorage', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const slot = firstDay.locator('[data-testid="slot-0-breakfast"]');

    // Remove a meal
    const removeButton = slot.locator('[data-testid^="remove-meal-"]').first();
    await removeButton.click();

    // Verify localStorage was updated
    const storedState = await page.evaluate(() => {
      const stored = localStorage.getItem('food-plan-storage');
      return stored ? JSON.parse(stored) : null;
    });

    expect(storedState).not.toBeNull();
    expect(storedState.state.currentPlan).not.toBeNull();

    // Navigate to home and back to verify persistence
    await page.goto('/');
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });

    const fullPlanLink = page.getByTestId('view-full-plan-link');
    await fullPlanLink.scrollIntoViewIfNeeded();
    // Click at top-left of the button to avoid FAB overlap
    await fullPlanLink.click({ position: { x: 10, y: 10 } });
    await expect(page.getByTestId('meal-plan')).toBeVisible({ timeout: 15000 });

    // The state should have persisted
    const slotAfterReload = page.getByTestId('day-0').locator('[data-testid="slot-0-breakfast"]');
    await expect(slotAfterReload).toBeVisible();
  });

  test('Can dismiss drawer without making changes', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const slot = firstDay.locator('[data-testid="slot-0-breakfast"]');

    const initialMeals = await slot.locator('[data-testid^="meal-"]').count();

    const addButton = slot.locator('[data-testid="add-meal-0-breakfast"]');
    await addButton.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Press Escape to dismiss
    await page.keyboard.press('Escape');

    // Drawer should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Meal count should be unchanged
    const mealCount = await slot.locator('[data-testid^="meal-"]').count();
    expect(mealCount).toBe(initialMeals);
  });

  test('Recipe drawer shows a search input', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const slot = firstDay.locator('[data-testid="slot-0-breakfast"]');
    const addButton = slot.locator('[data-testid="add-meal-0-breakfast"]');
    await addButton.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await expect(page.getByTestId('recipe-search-input')).toBeVisible();
  });

  test('Searching filters the recipe list', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const slot = firstDay.locator('[data-testid="slot-0-breakfast"]');
    const addButton = slot.locator('[data-testid="add-meal-0-breakfast"]');
    await addButton.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    const countBefore = await page.locator('[data-testid^="recipe-option-"]').count();

    await page.getByTestId('recipe-search-input').fill('egg');

    const countAfter = await page.locator('[data-testid^="recipe-option-"]').count();
    const emptyState = page.getByTestId('recipe-search-empty');
    const emptyStateCount = await emptyState.count();

    // Either the list was filtered down or the empty state is shown
    expect(countAfter < countBefore || emptyStateCount > 0).toBe(true);

    // At least one of recipe options or empty state must be visible
    expect(countAfter + emptyStateCount).toBeGreaterThan(0);
  });

  test('Searching with no match shows empty state', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const slot = firstDay.locator('[data-testid="slot-0-breakfast"]');
    const addButton = slot.locator('[data-testid="add-meal-0-breakfast"]');
    await addButton.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.getByTestId('recipe-search-input').fill('zzznomatch');

    await expect(page.getByTestId('recipe-search-empty')).toBeVisible();
    await expect(page.getByTestId('recipe-search-empty')).toContainText('No recipes match your search.');

    const recipeOptions = page.locator('[data-testid^="recipe-option-"]');
    await expect(recipeOptions).toHaveCount(0);
  });

  test('Search resets when drawer is closed and reopened', async ({ page }) => {
    const firstDay = page.getByTestId('day-0');
    const slot = firstDay.locator('[data-testid="slot-0-breakfast"]');
    const addButton = slot.locator('[data-testid="add-meal-0-breakfast"]');

    await addButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.getByTestId('recipe-search-input').fill('zzznomatch');

    // Close the drawer
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Reopen the drawer
    await addButton.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Search input should be reset to empty
    await expect(page.getByTestId('recipe-search-input')).toHaveValue('');
  });
});
