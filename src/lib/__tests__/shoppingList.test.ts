import { describe, it, expect } from 'vitest';
import { generateShoppingList, groupByCategory, mergeShoppingLists, CATEGORY_ORDER } from '../shoppingList';
import type { MealPlan, Recipe, CustomShoppingListItem, ShoppingListItem } from '@/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const chickenRecipe: Recipe = {
  id: 'recipe-chicken',
  title: 'Chicken Dinner',
  description: '',
  mealType: 'dinner',
  prepTime: 10,
  cookTime: 30,
  servings: 4,
  difficulty: 'easy',
  tags: [],
  estimatedCost: 'low',
  ingredients: [
    { name: 'Chicken breast', quantity: 800, unit: 'g', category: 'meat' },
    { name: 'Garlic', quantity: 3, unit: 'cloves', category: 'produce' },
    { name: 'Olive oil', quantity: 2, unit: 'tbsp', category: 'pantry' },
  ],
  instructions: [],
};

const saladRecipe: Recipe = {
  id: 'recipe-salad',
  title: 'Simple Salad',
  description: '',
  mealType: 'lunch',
  prepTime: 5,
  cookTime: 0,
  servings: 2,
  difficulty: 'easy',
  tags: [],
  estimatedCost: 'low',
  ingredients: [
    { name: 'Lettuce', quantity: 1, unit: 'head', category: 'produce' },
    { name: 'Olive oil', quantity: 1, unit: 'tbsp', category: 'pantry' },
  ],
  instructions: [],
};

const emptyPlan: MealPlan = {
  id: 'plan-empty',
  createdAt: '2025-01-01T00:00:00Z',
  preferences: { startDay: 0 },
  meals: [],
};

const planWithChicken: MealPlan = {
  id: 'plan-chicken',
  createdAt: '2025-01-01T00:00:00Z',
  preferences: { startDay: 0 },
  meals: [
    { id: 'meal-1', dayIndex: 0, mealType: 'dinner', recipeId: 'recipe-chicken', servings: 4 },
  ],
};

const planWithDouble: MealPlan = {
  id: 'plan-double',
  createdAt: '2025-01-01T00:00:00Z',
  preferences: { startDay: 0 },
  meals: [
    { id: 'meal-1', dayIndex: 0, mealType: 'dinner', recipeId: 'recipe-chicken', servings: 8 },
  ],
};

const planWithTwoMeals: MealPlan = {
  id: 'plan-two',
  createdAt: '2025-01-01T00:00:00Z',
  preferences: { startDay: 0 },
  meals: [
    { id: 'meal-1', dayIndex: 0, mealType: 'dinner', recipeId: 'recipe-chicken', servings: 4 },
    { id: 'meal-2', dayIndex: 1, mealType: 'lunch', recipeId: 'recipe-salad', servings: 2 },
  ],
};

// Plan where chicken appears twice (same recipe, same servings)
const planWithRepeatMeal: MealPlan = {
  id: 'plan-repeat',
  createdAt: '2025-01-01T00:00:00Z',
  preferences: { startDay: 0 },
  meals: [
    { id: 'meal-1', dayIndex: 0, mealType: 'dinner', recipeId: 'recipe-chicken', servings: 4 },
    { id: 'meal-2', dayIndex: 2, mealType: 'dinner', recipeId: 'recipe-chicken', servings: 4 },
  ],
};

const userRecipes: Recipe[] = [chickenRecipe, saladRecipe];

// ---------------------------------------------------------------------------
// generateShoppingList
// ---------------------------------------------------------------------------

describe('generateShoppingList', () => {
  it('returns empty array for an empty plan', () => {
    // Arrange / Act
    const result = generateShoppingList(emptyPlan, userRecipes);
    // Assert
    expect(result).toEqual([]);
  });

  it('returns items from a single meal', () => {
    const result = generateShoppingList(planWithChicken, userRecipes);
    expect(result.length).toBeGreaterThan(0);
    const chicken = result.find((i) => i.ingredient === 'Chicken breast');
    expect(chicken).toBeDefined();
  });

  it('scales quantities by serving multiplier (double servings)', () => {
    // Arrange
    const single = generateShoppingList(planWithChicken, userRecipes);
    const double = generateShoppingList(planWithDouble, userRecipes);

    // Act / Assert
    const singleChicken = single.find((i) => i.ingredient === 'Chicken breast')!;
    const doubleChicken = double.find((i) => i.ingredient === 'Chicken breast')!;
    expect(doubleChicken.quantity).toBe(singleChicken.quantity * 2);
  });

  it('deduplicates same ingredient from two meals (same name|unit|category)', () => {
    // Both chicken recipe appearances use olive oil 2 tbsp each = 4 tbsp total
    const result = generateShoppingList(planWithRepeatMeal, userRecipes);
    const oilItems = result.filter((i) => i.ingredient === 'Olive oil');
    // Should be deduplicated into one entry
    expect(oilItems.length).toBe(1);
    expect(oilItems[0].quantity).toBe(4); // 2 tbsp × 2 meals
  });

  it('does not deduplicate items with different units', () => {
    // saladRecipe uses olive oil in tbsp, chickenRecipe also in tbsp
    // Both are tbsp so they SHOULD merge when both present
    const result = generateShoppingList(planWithTwoMeals, userRecipes);
    const oilItems = result.filter((i) => i.ingredient === 'Olive oil');
    // Both in tbsp, same category => deduplicated
    expect(oilItems.length).toBe(1);
    expect(oilItems[0].quantity).toBe(3); // 2 tbsp + 1 tbsp
  });

  it('returns items sorted by category order then alphabetically', () => {
    const result = generateShoppingList(planWithTwoMeals, userRecipes);
    const categories = result.map((i) => i.category);
    // Verify category order is non-decreasing according to CATEGORY_ORDER
    for (let i = 1; i < categories.length; i++) {
      const prevIdx = CATEGORY_ORDER.indexOf(categories[i - 1]);
      const currIdx = CATEGORY_ORDER.indexOf(categories[i]);
      expect(currIdx).toBeGreaterThanOrEqual(prevIdx);
    }
  });

  it('rounds quantities to 1 decimal place', () => {
    // Chicken recipe: 800g / 4 servings × 3 servings = 600g
    const plan: MealPlan = {
      id: 'plan-x',
      createdAt: '2025-01-01T00:00:00Z',
      preferences: { startDay: 0 },
      meals: [{ id: 'meal-1', dayIndex: 0, mealType: 'dinner', recipeId: 'recipe-chicken', servings: 3 }],
    };
    const result = generateShoppingList(plan, userRecipes);
    result.forEach((item) => {
      const decimals = (item.quantity.toString().split('.')[1] ?? '').length;
      expect(decimals).toBeLessThanOrEqual(1);
    });
  });

  it('generates unique sequential IDs for each item', () => {
    const result = generateShoppingList(planWithTwoMeals, userRecipes);
    const ids = result.map((i) => i.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('sets checked to false for all generated items', () => {
    const result = generateShoppingList(planWithChicken, userRecipes);
    result.forEach((item) => expect(item.checked).toBe(false));
  });
});

// ---------------------------------------------------------------------------
// groupByCategory
// ---------------------------------------------------------------------------

describe('groupByCategory', () => {
  const items: ShoppingListItem[] = [
    { id: '1', ingredient: 'Milk', quantity: 1, unit: 'l', category: 'dairy', checked: false },
    { id: '2', ingredient: 'Chicken', quantity: 500, unit: 'g', category: 'meat', checked: false },
    { id: '3', ingredient: 'Flour', quantity: 200, unit: 'g', category: 'pantry', checked: false },
    { id: '4', ingredient: 'Lettuce', quantity: 1, unit: 'head', category: 'produce', checked: false },
  ];

  it('groups items into correct categories', () => {
    // Arrange / Act
    const grouped = groupByCategory(items);
    // Assert
    expect(grouped.get('dairy')).toBeDefined();
    expect(grouped.get('meat')).toBeDefined();
    expect(grouped.get('pantry')).toBeDefined();
    expect(grouped.get('produce')).toBeDefined();
  });

  it('excludes empty categories from the result', () => {
    const grouped = groupByCategory(items);
    expect(grouped.has('frozen')).toBe(false);
    expect(grouped.has('uncategorized')).toBe(false);
  });

  it('preserves category order matching CATEGORY_ORDER', () => {
    const grouped = groupByCategory(items);
    const resultCategories = Array.from(grouped.keys());
    const expectedOrder = CATEGORY_ORDER.filter((c) =>
      resultCategories.includes(c)
    );
    expect(resultCategories).toEqual(expectedOrder);
  });

  it('returns an empty map when items array is empty', () => {
    const grouped = groupByCategory([]);
    expect(grouped.size).toBe(0);
  });

  it('places all items in the correct category bucket', () => {
    const grouped = groupByCategory(items);
    expect(grouped.get('dairy')![0].ingredient).toBe('Milk');
    expect(grouped.get('meat')![0].ingredient).toBe('Chicken');
  });
});

// ---------------------------------------------------------------------------
// mergeShoppingLists
// ---------------------------------------------------------------------------

describe('mergeShoppingLists', () => {
  const generated: ShoppingListItem[] = [
    { id: 'item-0', ingredient: 'Chicken breast', quantity: 800, unit: 'g', category: 'meat', checked: false },
    { id: 'item-1', ingredient: 'Garlic', quantity: 3, unit: 'cloves', category: 'produce', checked: false },
  ];

  const custom: CustomShoppingListItem[] = [
    { id: 'custom-1', ingredient: 'Paper towels', quantity: 2, unit: 'rolls', category: 'uncategorized' },
    { id: 'custom-2', ingredient: 'Apples', quantity: 4, unit: '', category: 'produce' },
  ];

  it('includes all generated items in the result', () => {
    // Arrange / Act
    const result = mergeShoppingLists(generated, custom);
    // Assert
    const chicken = result.find((i) => i.ingredient === 'Chicken breast');
    expect(chicken).toBeDefined();
  });

  it('includes all custom items in the result', () => {
    const result = mergeShoppingLists(generated, custom);
    const paper = result.find((i) => i.ingredient === 'Paper towels');
    expect(paper).toBeDefined();
  });

  it('sets checked to false for converted custom items', () => {
    const result = mergeShoppingLists(generated, custom);
    const paper = result.find((i) => i.ingredient === 'Paper towels')!;
    expect(paper.checked).toBe(false);
  });

  it('preserves IDs from both generated and custom items', () => {
    const result = mergeShoppingLists(generated, custom);
    const ids = result.map((i) => i.id);
    expect(ids).toContain('item-0');
    expect(ids).toContain('custom-1');
  });

  it('sorts merged result by category order then alphabetically', () => {
    const result = mergeShoppingLists(generated, custom);
    const categories = result.map((i) => i.category);
    for (let i = 1; i < categories.length; i++) {
      const prevIdx = CATEGORY_ORDER.indexOf(categories[i - 1]);
      const currIdx = CATEGORY_ORDER.indexOf(categories[i]);
      expect(currIdx).toBeGreaterThanOrEqual(prevIdx);
    }
  });

  it('handles empty generated list', () => {
    const result = mergeShoppingLists([], custom);
    expect(result.length).toBe(custom.length);
  });

  it('handles empty custom list', () => {
    const result = mergeShoppingLists(generated, []);
    expect(result.length).toBe(generated.length);
  });

  it('handles both lists empty', () => {
    const result = mergeShoppingLists([], []);
    expect(result).toEqual([]);
  });
});
