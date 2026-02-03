'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MealPlan, MealPlanPreferences, Recipe } from '@/types';
import { swapMeal } from '@/lib/planGenerator';

interface AppState {
  currentPlan: MealPlan | null;
  setCurrentPlan: (plan: MealPlan | null) => void;
  swapMeal: (mealId: string, recipeId?: string) => void;
  checkedItems: string[];
  toggleCheckedItem: (itemId: string) => void;
  clearCheckedItems: () => void;
  userRecipes: Recipe[];
  addUserRecipe: (recipe: Recipe) => void;
  removeUserRecipe: (id: string) => void;
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
    }),
    {
      name: 'food-plan-storage',
    }
  )
);

// Default preferences
export const defaultPreferences: MealPlanPreferences = {
  numberOfPeople: 4,
  numberOfDays: 7,
  includeMeals: {
    breakfast: true,
    lunch: true,
    dinner: true,
  },
  budget: 'medium',
};
