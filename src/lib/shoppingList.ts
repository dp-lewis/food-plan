import { MealPlan, ShoppingListItem, IngredientCategory, Recipe, CustomShoppingListItem } from '@/types';
import { getRecipeById } from '@/data/recipes';

interface AggregatedIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
}

const CATEGORY_ORDER: IngredientCategory[] = ['produce', 'meat', 'dairy', 'frozen', 'pantry', 'uncategorized'];

const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  produce: 'Produce',
  meat: 'Meat & Fish',
  dairy: 'Dairy',
  frozen: 'Frozen',
  pantry: 'Pantry',
  uncategorized: 'Other',
};

export function generateShoppingList(plan: MealPlan, userRecipes: Recipe[] = []): ShoppingListItem[] {
  const ingredientMap = new Map<string, AggregatedIngredient>();

  for (const meal of plan.meals) {
    const recipe = getRecipeById(meal.recipeId, userRecipes);
    if (!recipe) continue;

    // Calculate serving multiplier
    const servingMultiplier = meal.servings / recipe.servings;

    for (const ingredient of recipe.ingredients) {
      // Create a key for aggregation (name + unit + category)
      const key = `${ingredient.name.toLowerCase()}|${ingredient.unit.toLowerCase()}|${ingredient.category}`;

      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        existing.quantity += ingredient.quantity * servingMultiplier;
      } else {
        ingredientMap.set(key, {
          name: ingredient.name,
          quantity: ingredient.quantity * servingMultiplier,
          unit: ingredient.unit,
          category: ingredient.category,
        });
      }
    }
  }

  // Convert to array and create ShoppingListItems
  const items: ShoppingListItem[] = Array.from(ingredientMap.values()).map((ing, index) => ({
    id: `item-${index}`,
    ingredient: ing.name,
    quantity: Math.round(ing.quantity * 10) / 10, // Round to 1 decimal
    unit: ing.unit,
    category: ing.category,
    checked: false,
  }));

  // Sort by category order, then by name
  items.sort((a, b) => {
    const categoryDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (categoryDiff !== 0) return categoryDiff;
    return a.ingredient.localeCompare(b.ingredient);
  });

  return items;
}

export function groupByCategory(items: ShoppingListItem[]): Map<IngredientCategory, ShoppingListItem[]> {
  const grouped = new Map<IngredientCategory, ShoppingListItem[]>();

  for (const category of CATEGORY_ORDER) {
    const categoryItems = items.filter((item) => item.category === category);
    if (categoryItems.length > 0) {
      grouped.set(category, categoryItems);
    }
  }

  return grouped;
}

export function mergeShoppingLists(
  generatedItems: ShoppingListItem[],
  customItems: CustomShoppingListItem[]
): ShoppingListItem[] {
  // Convert custom items to ShoppingListItem format
  const convertedCustom: ShoppingListItem[] = customItems.map((item) => ({
    id: item.id,
    ingredient: item.ingredient,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
    checked: false,
  }));

  // Combine and sort by category order, then alphabetically
  const combined = [...generatedItems, ...convertedCustom];
  combined.sort((a, b) => {
    const categoryDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (categoryDiff !== 0) return categoryDiff;
    return a.ingredient.localeCompare(b.ingredient);
  });

  return combined;
}

export { CATEGORY_LABELS, CATEGORY_ORDER };
