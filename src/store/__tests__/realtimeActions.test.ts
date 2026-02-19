import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store';
import type { Meal, MealPlan, CustomShoppingListItem } from '@/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePlan(meals: Meal[] = []): MealPlan {
  return {
    id: 'plan-1',
    createdAt: '2025-01-06T00:00:00Z',
    preferences: { startDay: 0 },
    meals,
  };
}

function makeMeal(id: string, recipeId = 'recipe-a'): Meal {
  return { id, dayIndex: 0, mealType: 'dinner', recipeId, servings: 4 };
}

function makeCustomItem(id: string, ingredient = 'Olive oil'): CustomShoppingListItem {
  return { id, ingredient, quantity: 1, unit: 'tbsp', category: 'pantry' };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset the store to a clean state with a known plan and custom items. */
function seedStore(meals: Meal[] = [], customShoppingItems: CustomShoppingListItem[] = []) {
  useStore.setState({
    currentPlan: makePlan(meals),
    customShoppingItems,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('_applyRemoteMealInsert', () => {
  beforeEach(() => {
    seedStore([makeMeal('meal-1', 'recipe-a')]);
  });

  it('inserts a new meal into currentPlan.meals', () => {
    // Arrange
    const newMeal = makeMeal('meal-2', 'recipe-b');

    // Act
    useStore.getState()._applyRemoteMealInsert(newMeal);

    // Assert
    const { meals } = useStore.getState().currentPlan!;
    expect(meals).toHaveLength(2);
    expect(meals.find((m) => m.id === 'meal-2')).toEqual(newMeal);
  });

  it('preserves the existing meal when inserting a new one', () => {
    // Arrange
    const newMeal = makeMeal('meal-2', 'recipe-b');

    // Act
    useStore.getState()._applyRemoteMealInsert(newMeal);

    // Assert
    const { meals } = useStore.getState().currentPlan!;
    expect(meals.find((m) => m.id === 'meal-1')).toBeDefined();
  });

  it('skips insert (dedup) if a meal with the same id already exists', () => {
    // Arrange — insert a meal with id 'meal-1', which already exists
    const duplicate = makeMeal('meal-1', 'recipe-different');

    // Act
    useStore.getState()._applyRemoteMealInsert(duplicate);

    // Assert — still only one meal, original recipeId preserved
    const { meals } = useStore.getState().currentPlan!;
    expect(meals).toHaveLength(1);
    expect(meals[0].recipeId).toBe('recipe-a');
  });

  it('is a no-op when currentPlan is null', () => {
    // Arrange
    useStore.setState({ currentPlan: null });
    const newMeal = makeMeal('meal-x');

    // Act
    useStore.getState()._applyRemoteMealInsert(newMeal);

    // Assert — plan stays null
    expect(useStore.getState().currentPlan).toBeNull();
  });
});

describe('_applyRemoteMealDelete', () => {
  beforeEach(() => {
    seedStore([makeMeal('meal-1'), makeMeal('meal-2')]);
  });

  it('removes the meal with the matching id', () => {
    // Act
    useStore.getState()._applyRemoteMealDelete('meal-1');

    // Assert
    const { meals } = useStore.getState().currentPlan!;
    expect(meals).toHaveLength(1);
    expect(meals.find((m) => m.id === 'meal-1')).toBeUndefined();
  });

  it('preserves other meals when deleting one', () => {
    // Act
    useStore.getState()._applyRemoteMealDelete('meal-1');

    // Assert
    const { meals } = useStore.getState().currentPlan!;
    expect(meals[0].id).toBe('meal-2');
  });

  it('is a no-op when the id is not found', () => {
    // Act
    useStore.getState()._applyRemoteMealDelete('meal-does-not-exist');

    // Assert — both original meals still present
    const { meals } = useStore.getState().currentPlan!;
    expect(meals).toHaveLength(2);
  });

  it('is a no-op when currentPlan is null', () => {
    // Arrange
    useStore.setState({ currentPlan: null });

    // Act
    useStore.getState()._applyRemoteMealDelete('meal-1');

    // Assert
    expect(useStore.getState().currentPlan).toBeNull();
  });
});

describe('_applyRemoteMealUpdate', () => {
  beforeEach(() => {
    seedStore([makeMeal('meal-1', 'recipe-a'), makeMeal('meal-2', 'recipe-b')]);
  });

  it('replaces the meal with matching id', () => {
    // Arrange
    const updated: Meal = { id: 'meal-1', dayIndex: 3, mealType: 'lunch', recipeId: 'recipe-z', servings: 2 };

    // Act
    useStore.getState()._applyRemoteMealUpdate(updated);

    // Assert
    const found = useStore.getState().currentPlan!.meals.find((m) => m.id === 'meal-1')!;
    expect(found.recipeId).toBe('recipe-z');
    expect(found.dayIndex).toBe(3);
    expect(found.mealType).toBe('lunch');
    expect(found.servings).toBe(2);
  });

  it('leaves other meals unchanged when updating one', () => {
    // Arrange
    const updated: Meal = { id: 'meal-1', dayIndex: 0, mealType: 'dinner', recipeId: 'recipe-z', servings: 4 };

    // Act
    useStore.getState()._applyRemoteMealUpdate(updated);

    // Assert
    const other = useStore.getState().currentPlan!.meals.find((m) => m.id === 'meal-2')!;
    expect(other.recipeId).toBe('recipe-b');
  });

  it('is a no-op when the id is not found', () => {
    // Arrange
    const updated: Meal = { id: 'meal-does-not-exist', dayIndex: 0, mealType: 'dinner', recipeId: 'recipe-z', servings: 4 };

    // Act
    useStore.getState()._applyRemoteMealUpdate(updated);

    // Assert — original meals untouched
    const { meals } = useStore.getState().currentPlan!;
    expect(meals).toHaveLength(2);
    expect(meals[0].recipeId).toBe('recipe-a');
    expect(meals[1].recipeId).toBe('recipe-b');
  });

  it('is a no-op when currentPlan is null', () => {
    // Arrange
    useStore.setState({ currentPlan: null });
    const updated: Meal = { id: 'meal-1', dayIndex: 0, mealType: 'dinner', recipeId: 'recipe-z', servings: 4 };

    // Act
    useStore.getState()._applyRemoteMealUpdate(updated);

    // Assert
    expect(useStore.getState().currentPlan).toBeNull();
  });
});

describe('_applyRemoteCustomItemInsert', () => {
  beforeEach(() => {
    seedStore([], [makeCustomItem('custom-1', 'Garlic')]);
  });

  it('inserts a new custom item', () => {
    // Arrange
    const newItem = makeCustomItem('custom-2', 'Butter');

    // Act
    useStore.getState()._applyRemoteCustomItemInsert(newItem);

    // Assert
    const { customShoppingItems } = useStore.getState();
    expect(customShoppingItems).toHaveLength(2);
    expect(customShoppingItems.find((i) => i.id === 'custom-2')).toEqual(newItem);
  });

  it('preserves existing items when inserting a new one', () => {
    // Arrange
    const newItem = makeCustomItem('custom-2', 'Butter');

    // Act
    useStore.getState()._applyRemoteCustomItemInsert(newItem);

    // Assert
    const { customShoppingItems } = useStore.getState();
    expect(customShoppingItems.find((i) => i.id === 'custom-1')).toBeDefined();
  });

  it('skips insert (dedup) if an item with the same id already exists', () => {
    // Arrange — use the same id as the seeded item
    const duplicate = makeCustomItem('custom-1', 'Different ingredient');

    // Act
    useStore.getState()._applyRemoteCustomItemInsert(duplicate);

    // Assert — still one item, original ingredient preserved
    const { customShoppingItems } = useStore.getState();
    expect(customShoppingItems).toHaveLength(1);
    expect(customShoppingItems[0].ingredient).toBe('Garlic');
  });
});

describe('_applyRemoteCustomItemDelete', () => {
  beforeEach(() => {
    seedStore([], [makeCustomItem('custom-1', 'Garlic'), makeCustomItem('custom-2', 'Butter')]);
  });

  it('removes the item with the matching id', () => {
    // Act
    useStore.getState()._applyRemoteCustomItemDelete('custom-1');

    // Assert
    const { customShoppingItems } = useStore.getState();
    expect(customShoppingItems).toHaveLength(1);
    expect(customShoppingItems.find((i) => i.id === 'custom-1')).toBeUndefined();
  });

  it('preserves other items when deleting one', () => {
    // Act
    useStore.getState()._applyRemoteCustomItemDelete('custom-1');

    // Assert
    const { customShoppingItems } = useStore.getState();
    expect(customShoppingItems[0].id).toBe('custom-2');
  });

  it('is a no-op when the id is not found', () => {
    // Act
    useStore.getState()._applyRemoteCustomItemDelete('custom-does-not-exist');

    // Assert — both original items still present
    const { customShoppingItems } = useStore.getState();
    expect(customShoppingItems).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Additional helpers
// ---------------------------------------------------------------------------

function makeCheckedItems(pairs: [string, string][]): Record<string, string> {
  return Object.fromEntries(pairs);
}

function seedCheckedItems(items: Record<string, string> = {}) {
  useStore.setState({ checkedItems: items });
}

// ---------------------------------------------------------------------------
// _mergeCheckedItem
// ---------------------------------------------------------------------------

describe('_mergeCheckedItem', () => {
  it("adds a new checked item with the checker's email", () => {
    // Arrange
    seedCheckedItems({});

    // Act
    useStore.getState()._mergeCheckedItem('item-1', 'alice@example.com');

    // Assert
    expect(useStore.getState().checkedItems['item-1']).toBe('alice@example.com');
  });

  it('overwrites the email if the item was already checked by someone else', () => {
    // Arrange
    seedCheckedItems(makeCheckedItems([['item-1', 'alice@example.com']]));

    // Act
    useStore.getState()._mergeCheckedItem('item-1', 'bob@example.com');

    // Assert
    expect(useStore.getState().checkedItems['item-1']).toBe('bob@example.com');
  });

  it('preserves other checked items when merging one', () => {
    // Arrange
    seedCheckedItems(makeCheckedItems([['item-1', 'alice@example.com'], ['item-2', 'bob@example.com']]));

    // Act
    useStore.getState()._mergeCheckedItem('item-3', 'carol@example.com');

    // Assert
    const { checkedItems } = useStore.getState();
    expect(checkedItems['item-1']).toBe('alice@example.com');
    expect(checkedItems['item-2']).toBe('bob@example.com');
    expect(checkedItems['item-3']).toBe('carol@example.com');
  });
});

// ---------------------------------------------------------------------------
// _removeCheckedItem
// ---------------------------------------------------------------------------

describe('_removeCheckedItem', () => {
  beforeEach(() => {
    seedCheckedItems(makeCheckedItems([['item-1', 'alice@example.com'], ['item-2', 'bob@example.com']]));
  });

  it('removes the item with the matching id', () => {
    // Act
    useStore.getState()._removeCheckedItem('item-1');

    // Assert
    expect('item-1' in useStore.getState().checkedItems).toBe(false);
  });

  it('preserves other checked items when removing one', () => {
    // Act
    useStore.getState()._removeCheckedItem('item-1');

    // Assert
    expect(useStore.getState().checkedItems['item-2']).toBe('bob@example.com');
  });

  it('is a no-op when the id is not found', () => {
    // Act
    useStore.getState()._removeCheckedItem('item-does-not-exist');

    // Assert — both original items still present
    const { checkedItems } = useStore.getState();
    expect(checkedItems['item-1']).toBe('alice@example.com');
    expect(checkedItems['item-2']).toBe('bob@example.com');
  });
});

// ---------------------------------------------------------------------------
// _setCheckedItems
// ---------------------------------------------------------------------------

describe('_setCheckedItems', () => {
  it('replaces all checked items with the provided map', () => {
    // Arrange
    seedCheckedItems(makeCheckedItems([['old-1', 'alice@example.com'], ['old-2', 'bob@example.com']]));

    // Act
    useStore.getState()._setCheckedItems({ 'new-1': 'carol@example.com' });

    // Assert
    expect(useStore.getState().checkedItems).toEqual({ 'new-1': 'carol@example.com' });
  });

  it('clears all checked items when called with an empty map', () => {
    // Arrange
    seedCheckedItems(makeCheckedItems([['item-1', 'alice@example.com']]));

    // Act
    useStore.getState()._setCheckedItems({});

    // Assert
    expect(useStore.getState().checkedItems).toEqual({});
  });

  it('sets checked items from scratch on an empty store', () => {
    // Arrange
    seedCheckedItems({});

    // Act
    useStore.getState()._setCheckedItems({ 'item-1': 'alice@example.com', 'item-2': 'bob@example.com' });

    // Assert
    expect(useStore.getState().checkedItems).toEqual({
      'item-1': 'alice@example.com',
      'item-2': 'bob@example.com',
    });
  });
});

// ---------------------------------------------------------------------------
// _addRemoteCustomItem
// ---------------------------------------------------------------------------

describe('_addRemoteCustomItem', () => {
  it('adds a new custom item that is not already present', () => {
    // Arrange
    seedStore([], [makeCustomItem('c-1')]);

    // Act
    useStore.getState()._addRemoteCustomItem(makeCustomItem('c-2', 'Salt'));

    // Assert
    const { customShoppingItems } = useStore.getState();
    expect(customShoppingItems).toHaveLength(2);
    expect(customShoppingItems.find((i) => i.id === 'c-2')).toBeDefined();
  });

  it('skips add if an item with the same id is already in the list', () => {
    // Arrange
    seedStore([], [makeCustomItem('c-1', 'Garlic')]);

    // Act
    useStore.getState()._addRemoteCustomItem(makeCustomItem('c-1', 'Different ingredient'));

    // Assert — still one item, original ingredient preserved
    const { customShoppingItems } = useStore.getState();
    expect(customShoppingItems).toHaveLength(1);
    expect(customShoppingItems[0].ingredient).toBe('Garlic');
  });
});

// ---------------------------------------------------------------------------
// _removeRemoteCustomItem
// ---------------------------------------------------------------------------

describe('_removeRemoteCustomItem', () => {
  beforeEach(() => {
    seedStore([], [makeCustomItem('c-1', 'Garlic'), makeCustomItem('c-2', 'Butter')]);
  });

  it('removes the item with the matching id', () => {
    // Act
    useStore.getState()._removeRemoteCustomItem('c-1');

    // Assert
    const { customShoppingItems } = useStore.getState();
    expect(customShoppingItems).toHaveLength(1);
    expect(customShoppingItems.find((i) => i.id === 'c-1')).toBeUndefined();
  });

  it('is a no-op when the id is not found', () => {
    // Act
    useStore.getState()._removeRemoteCustomItem('c-does-not-exist');

    // Assert — both original items still present
    expect(useStore.getState().customShoppingItems).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// _setCustomShoppingItems
// ---------------------------------------------------------------------------

describe('_setCustomShoppingItems', () => {
  it('replaces all custom shopping items with the provided list', () => {
    // Arrange
    seedStore([], [makeCustomItem('c-1', 'Garlic'), makeCustomItem('c-2', 'Butter')]);
    const newItems = [makeCustomItem('c-3', 'Salt')];

    // Act
    useStore.getState()._setCustomShoppingItems(newItems);

    // Assert
    expect(useStore.getState().customShoppingItems).toEqual(newItems);
  });

  it('clears custom shopping items when called with an empty array', () => {
    // Arrange
    seedStore([], [makeCustomItem('c-1', 'Garlic')]);

    // Act
    useStore.getState()._setCustomShoppingItems([]);

    // Assert
    expect(useStore.getState().customShoppingItems).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// _clearCurrentPlan
// ---------------------------------------------------------------------------

describe('_clearCurrentPlan', () => {
  beforeEach(() => {
    seedStore([makeMeal('meal-1')], [makeCustomItem('c-1')]);
    seedCheckedItems({ 'item-x': 'alice@example.com' });
    useStore.setState({ _planRole: 'member' });
  });

  it('sets currentPlan to null', () => {
    // Act
    useStore.getState()._clearCurrentPlan();

    // Assert
    expect(useStore.getState().currentPlan).toBeNull();
  });

  it('clears all checked items', () => {
    // Act
    useStore.getState()._clearCurrentPlan();

    // Assert
    expect(useStore.getState().checkedItems).toEqual({});
  });

  it('clears all custom shopping items', () => {
    // Act
    useStore.getState()._clearCurrentPlan();

    // Assert
    expect(useStore.getState().customShoppingItems).toEqual([]);
  });

  it('clears _planRole', () => {
    // Act
    useStore.getState()._clearCurrentPlan();

    // Assert
    expect(useStore.getState()._planRole).toBeNull();
  });
});
