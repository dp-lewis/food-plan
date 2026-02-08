export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type BudgetLevel = 'low' | 'medium' | 'high';
export type IngredientCategory = 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'uncategorized';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  mealType: MealType;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: Difficulty;
  tags: string[];
  estimatedCost: BudgetLevel;
  ingredients: Ingredient[];
  instructions: string[];
  // For imported recipes
  sourceUrl?: string;
  sourceName?: string;
  isUserRecipe?: boolean;
  // For manual recipes - brief reminders
  notes?: string;
}

export interface Meal {
  id: string;
  dayIndex: number; // 0-6 (Monday-Sunday)
  mealType: MealType;
  recipeId: string;
  servings: number;
}

export interface MealPlanPreferences {
  numberOfDays: number;
  includeMeals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  budget: BudgetLevel;
}

export interface MealPlan {
  id: string;
  createdAt: string;
  preferences: MealPlanPreferences;
  meals: Meal[];
}

export interface ShoppingListItem {
  id: string;
  ingredient: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  checked: boolean;
}

export interface CustomShoppingListItem {
  id: string;                      // Prefixed 'custom-' to avoid collisions
  ingredient: string;              // Item name
  quantity: number;                // Default 1
  unit: string;                    // Optional, empty string default
  category: IngredientCategory;    // Auto-detected via categorizeIngredient()
}
