import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useStore } from '../store';
import { setupSyncSubscriber } from '../syncSubscriber';
import type { Meal, MealPlan, CustomShoppingListItem, Recipe } from '@/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/app/actions/mealPlan', () => ({
  syncMealPlan: vi.fn().mockResolvedValue({}),
  addMealAction: vi.fn().mockResolvedValue({}),
  removeMealAction: vi.fn().mockResolvedValue({}),
  swapMealAction: vi.fn().mockResolvedValue({}),
  deletePlanAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/app/actions/recipes', () => ({
  saveUserRecipe: vi.fn().mockResolvedValue({}),
  deleteUserRecipeAction: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/app/actions/shoppingList', () => ({
  toggleCheckedItemAction: vi.fn().mockResolvedValue({}),
  clearCheckedItemsAction: vi.fn().mockResolvedValue({}),
  addCustomItemAction: vi.fn().mockResolvedValue({}),
  removeCustomItemAction: vi.fn().mockResolvedValue({}),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlan(meals: Meal[] = []): MealPlan {
  return { id: 'plan-1', createdAt: '2025-01-06T00:00:00Z', preferences: { startDay: 0 }, meals };
}

function makeMeal(id: string): Meal {
  return { id, dayIndex: 0, mealType: 'dinner', recipeId: 'recipe-a', servings: 4 };
}

function makeCustomItem(id: string): CustomShoppingListItem {
  return { id, ingredient: 'Olive oil', quantity: 1, unit: 'tbsp', category: 'pantry' };
}

function makeRecipe(id = 'r-1'): Recipe {
  return {
    id,
    title: 'Test Recipe',
    description: '',
    mealType: 'dinner',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'easy',
    tags: [],
    estimatedCost: 'low',
    ingredients: [],
    instructions: [],
  };
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

let unsubscribe: () => void;

beforeEach(() => {
  vi.clearAllMocks();
  useStore.setState({ _userId: 'user-1', _isOnline: true, _syncQueue: [] });
  unsubscribe = setupSyncSubscriber(useStore);
});

afterEach(() => {
  unsubscribe();
});

// ---------------------------------------------------------------------------
// Import mocked modules so we can assert on them
// ---------------------------------------------------------------------------

import {
  syncMealPlan,
  addMealAction,
  removeMealAction,
  swapMealAction,
} from '@/app/actions/mealPlan';
import { saveUserRecipe, deleteUserRecipeAction } from '@/app/actions/recipes';
import {
  toggleCheckedItemAction,
  clearCheckedItemsAction,
  addCustomItemAction,
  removeCustomItemAction,
} from '@/app/actions/shoppingList';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('setupSyncSubscriber', () => {
  // -------------------------------------------------------------------------
  // Authentication gating
  // -------------------------------------------------------------------------

  it('does not dispatch intents when _userId is null', () => {
    // Arrange
    useStore.setState({ _userId: null });

    // Act
    useStore.getState()._pushSync({ type: 'syncMealPlan', plan: makePlan() });

    // Assert
    expect(syncMealPlan).not.toHaveBeenCalled();
  });

  it('does not drain intents when offline', () => {
    // Arrange
    useStore.setState({ _isOnline: false });

    // Act
    useStore.getState()._pushSync({ type: 'toggleCheckedItem', planId: 'plan-1', itemId: 'item-1', checked: true, userEmail: 'alice@example.com' });

    // Assert — action was not dispatched
    expect(toggleCheckedItemAction).not.toHaveBeenCalled();
    // Assert — intent remains in queue
    expect(useStore.getState()._syncQueue.length).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Dispatch correctness
  // -------------------------------------------------------------------------

  it('dispatches syncMealPlan intent', () => {
    // Arrange
    const plan = makePlan();

    // Act
    useStore.getState()._pushSync({ type: 'syncMealPlan', plan });

    // Assert
    expect(syncMealPlan).toHaveBeenCalledWith(plan);
  });

  it('dispatches addMeal intent', () => {
    // Arrange
    const meal = makeMeal('m1');

    // Act
    useStore.getState()._pushSync({ type: 'addMeal', planId: 'plan-1', meal });

    // Assert
    expect(addMealAction).toHaveBeenCalledWith('plan-1', meal);
  });

  it('dispatches removeMeal intent', () => {
    // Act
    useStore.getState()._pushSync({ type: 'removeMeal', mealId: 'meal-x' });

    // Assert
    expect(removeMealAction).toHaveBeenCalledWith('meal-x');
  });

  it('dispatches swapMeal intent', () => {
    // Act
    useStore.getState()._pushSync({ type: 'swapMeal', mealId: 'meal-x', recipeId: 'recipe-y' });

    // Assert
    expect(swapMealAction).toHaveBeenCalledWith('meal-x', 'recipe-y');
  });

  it('dispatches toggleCheckedItem intent', () => {
    // Act
    useStore.getState()._pushSync({
      type: 'toggleCheckedItem',
      planId: 'plan-1',
      itemId: 'item-1',
      checked: true,
      userEmail: 'alice@example.com',
    });

    // Assert
    expect(toggleCheckedItemAction).toHaveBeenCalledWith('plan-1', 'item-1', true, 'alice@example.com');
  });

  it('dispatches clearCheckedItems intent', () => {
    // Act
    useStore.getState()._pushSync({ type: 'clearCheckedItems', planId: 'plan-1' });

    // Assert
    expect(clearCheckedItemsAction).toHaveBeenCalledWith('plan-1');
  });

  it('dispatches addCustomItem intent', () => {
    // Arrange
    const item = makeCustomItem('c-1');

    // Act
    useStore.getState()._pushSync({ type: 'addCustomItem', planId: 'plan-1', item });

    // Assert
    expect(addCustomItemAction).toHaveBeenCalledWith('plan-1', item);
  });

  it('dispatches removeCustomItem intent', () => {
    // Act
    useStore.getState()._pushSync({ type: 'removeCustomItem', itemId: 'c-1' });

    // Assert
    expect(removeCustomItemAction).toHaveBeenCalledWith('c-1');
  });

  it('dispatches saveUserRecipe intent', () => {
    // Arrange
    const recipe = makeRecipe();

    // Act
    useStore.getState()._pushSync({ type: 'saveUserRecipe', recipe });

    // Assert
    expect(saveUserRecipe).toHaveBeenCalledWith(recipe);
  });

  it('dispatches deleteUserRecipe intent', () => {
    // Act
    useStore.getState()._pushSync({ type: 'deleteUserRecipe', recipeId: 'r-1' });

    // Assert
    expect(deleteUserRecipeAction).toHaveBeenCalledWith('r-1');
  });

  // -------------------------------------------------------------------------
  // Queue behaviour
  // -------------------------------------------------------------------------

  it('drains multiple intents in one batch', () => {
    // Arrange — directly set two different intents in the queue, then trigger a
    // state change so the subscriber fires and processes them.
    const meal = makeMeal('m1');
    useStore.setState({
      _syncQueue: [
        { type: 'addMeal', planId: 'plan-1', meal, timestamp: Date.now() },
        { type: 'removeCustomItem', itemId: 'c-1', timestamp: Date.now() },
      ],
    });

    // Act — trigger a state change so the subscriber fires
    useStore.setState({ _isOnline: true });

    // Assert
    expect(addMealAction).toHaveBeenCalledWith('plan-1', meal);
    expect(removeCustomItemAction).toHaveBeenCalledWith('c-1');
  });

  it('leaves queue empty after draining', () => {
    // Act
    useStore.getState()._pushSync({ type: 'removeMeal', mealId: 'meal-x' });

    // Assert
    expect(useStore.getState()._syncQueue).toHaveLength(0);
  });
});
