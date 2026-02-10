'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MealPlan, MealPlanPreferences, Recipe, CustomShoppingListItem, Meal, MealType } from '@/types';
import { swapMeal } from '@/lib/planGenerator';
import { categorizeIngredient } from '@/lib/ingredientParser';
import { getRecipeById } from '@/data/recipes';
import { ParsedRecipe } from '@/lib/recipeParser';

interface AppState {
  currentPlan: MealPlan | null;
  setCurrentPlan: (plan: MealPlan | null) => void;
  swapMeal: (mealId: string, recipeId?: string) => void;
  addMeal: (dayIndex: number, mealType: MealType, recipeId: string) => void;
  removeMeal: (mealId: string) => void;
  checkedItems: string[];
  toggleCheckedItem: (itemId: string) => void;
  clearCheckedItems: () => void;
  userRecipes: Recipe[];
  addUserRecipe: (recipe: Recipe) => void;
  removeUserRecipe: (id: string) => void;
  customShoppingItems: CustomShoppingListItem[];
  addCustomItem: (ingredient: string, quantity?: number, unit?: string) => void;
  removeCustomItem: (itemId: string) => void;
  pendingImportedRecipe: ParsedRecipe | null;
  setPendingImportedRecipe: (recipe: ParsedRecipe | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPlan: null,
      setCurrentPlan: (plan) => set({ currentPlan: plan, checkedItems: [] }),
      swapMeal: (mealId, recipeId) => {
        const state = get();
        set({
          currentPlan: state.currentPlan
            ? swapMeal(state.currentPlan, mealId, state.userRecipes, recipeId)
            : null,
          checkedItems: [], // Reset shopping list when plan changes
        });
      },
      addMeal: (dayIndex, mealType, recipeId) => {
        const state = get();
        if (!state.currentPlan) return;

        // Use recipe's original servings (default to 4 if not found)
        const recipe = getRecipeById(recipeId, state.userRecipes);
        const servings = recipe?.servings ?? 4;

        const newMeal: Meal = {
          id: `meal-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          dayIndex,
          mealType,
          recipeId,
          servings,
        };

        set({
          currentPlan: {
            ...state.currentPlan,
            meals: [...state.currentPlan.meals, newMeal],
          },
          checkedItems: [],
        });
      },
      removeMeal: (mealId) => {
        const state = get();
        if (!state.currentPlan) return;

        set({
          currentPlan: {
            ...state.currentPlan,
            meals: state.currentPlan.meals.filter(m => m.id !== mealId),
          },
          checkedItems: [],
        });
      },
      checkedItems: [],
      toggleCheckedItem: (itemId) =>
        set((state) => ({
          checkedItems: state.checkedItems.includes(itemId)
            ? state.checkedItems.filter((id) => id !== itemId)
            : [...state.checkedItems, itemId],
        })),
      clearCheckedItems: () => set({ checkedItems: [] }),
      userRecipes: [],
      addUserRecipe: (recipe) =>
        set((state) => ({
          userRecipes: [...state.userRecipes, recipe],
        })),
      removeUserRecipe: (id) =>
        set((state) => ({
          userRecipes: state.userRecipes.filter((r) => r.id !== id),
        })),
      customShoppingItems: [],
      addCustomItem: (ingredient, quantity = 1, unit = '') =>
        set((state) => ({
          customShoppingItems: [
            ...state.customShoppingItems,
            {
              id: `custom-${crypto.randomUUID()}`,
              ingredient,
              quantity,
              unit,
              category: categorizeIngredient(ingredient),
            },
          ],
        })),
      removeCustomItem: (itemId) =>
        set((state) => ({
          customShoppingItems: state.customShoppingItems.filter((item) => item.id !== itemId),
        })),
      pendingImportedRecipe: null,
      setPendingImportedRecipe: (recipe) => set({ pendingImportedRecipe: recipe }),
    }),
    {
      name: 'food-plan-storage',
      partialize: (state) => ({
        currentPlan: state.currentPlan,
        checkedItems: state.checkedItems,
        userRecipes: state.userRecipes,
        customShoppingItems: state.customShoppingItems,
        // Note: pendingImportedRecipe is intentionally NOT persisted
      }),
      skipHydration: true,
    }
  )
);

// Default preferences
export const defaultPreferences: MealPlanPreferences = {
  startDay: 5, // Saturday (0=Monday ... 5=Saturday, 6=Sunday)
};
