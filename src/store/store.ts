'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MealPlan, MealPlanPreferences, Recipe, CustomShoppingListItem, Meal, MealType } from '@/types';
import { swapMeal as swapMealInPlan } from '@/lib/planGenerator';
import { categorizeIngredient } from '@/lib/ingredientParser';
import { getRecipeById } from '@/data/recipes';
import { ParsedRecipe } from '@/lib/recipeParser';
import { syncMealPlan, addMealAction, removeMealAction, swapMealAction } from '@/app/actions/mealPlan';
import { saveUserRecipe, deleteUserRecipeAction } from '@/app/actions/recipes';
import { toggleCheckedItemAction, clearCheckedItemsAction, addCustomItemAction, removeCustomItemAction } from '@/app/actions/shoppingList';
import { generateUUID } from '@/lib/uuid';

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
  // Sync fields — NOT persisted (excluded by partialize)
  _userId: string | null;
  _setUserId: (userId: string | null) => void;
  _isSyncing: boolean;
  _setIsSyncing: (syncing: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPlan: null,
      setCurrentPlan: (plan) => {
        set({ currentPlan: plan, checkedItems: [] });
        if (get()._userId) {
          if (plan) {
            syncMealPlan(plan).catch(console.error);
            clearCheckedItemsAction(plan.id).catch(console.error);
          }
        }
      },
      swapMeal: (mealId, recipeId) => {
        const state = get();
        set({
          currentPlan: state.currentPlan
            ? swapMealInPlan(state.currentPlan, mealId, state.userRecipes, recipeId)
            : null,
          checkedItems: [], // Reset shopping list when plan changes
        });
        if (get()._userId) {
          const updatedPlan = get().currentPlan;
          if (updatedPlan) {
            const updatedMeal = updatedPlan.meals.find((m) => m.id === mealId);
            if (updatedMeal?.recipeId) {
              swapMealAction(mealId, updatedMeal.recipeId).catch(console.error);
            }
            clearCheckedItemsAction(updatedPlan.id).catch(console.error);
          }
        }
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
        if (get()._userId) {
          const planId = get().currentPlan?.id;
          if (planId) {
            addMealAction(planId, newMeal).catch(console.error);
            clearCheckedItemsAction(planId).catch(console.error);
          }
        }
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
        if (get()._userId) {
          const planId = get().currentPlan?.id;
          removeMealAction(mealId).catch(console.error);
          if (planId) {
            clearCheckedItemsAction(planId).catch(console.error);
          }
        }
      },
      checkedItems: [],
      toggleCheckedItem: (itemId) => {
        set((state) => ({
          checkedItems: state.checkedItems.includes(itemId)
            ? state.checkedItems.filter((id) => id !== itemId)
            : [...state.checkedItems, itemId],
        }));
        if (get()._userId) {
          const planId = get().currentPlan?.id;
          if (planId) {
            const checked = get().checkedItems.includes(itemId);
            toggleCheckedItemAction(planId, itemId, checked).catch(console.error);
          }
        }
      },
      clearCheckedItems: () => {
        set({ checkedItems: [] });
        if (get()._userId) {
          const planId = get().currentPlan?.id;
          if (planId) {
            clearCheckedItemsAction(planId).catch(console.error);
          }
        }
      },
      userRecipes: [],
      addUserRecipe: (recipe) => {
        set((state) => ({
          userRecipes: [...state.userRecipes, recipe],
        }));
        if (get()._userId) {
          saveUserRecipe(recipe).catch(console.error);
        }
      },
      removeUserRecipe: (id) => {
        set((state) => ({
          userRecipes: state.userRecipes.filter((r) => r.id !== id),
        }));
        if (get()._userId) {
          deleteUserRecipeAction(id).catch(console.error);
        }
      },
      customShoppingItems: [],
      addCustomItem: (ingredient, quantity = 1, unit = '') => {
        set((state) => ({
          customShoppingItems: [
            ...state.customShoppingItems,
            {
              id: `custom-${generateUUID()}`,
              ingredient,
              quantity,
              unit,
              category: categorizeIngredient(ingredient),
            },
          ],
        }));
        if (get()._userId) {
          const planId = get().currentPlan?.id;
          if (planId) {
            const items = get().customShoppingItems;
            const newItem = items[items.length - 1];
            if (newItem) {
              addCustomItemAction(planId, newItem).catch(console.error);
            }
          }
        }
      },
      removeCustomItem: (itemId) => {
        set((state) => ({
          customShoppingItems: state.customShoppingItems.filter((item) => item.id !== itemId),
        }));
        if (get()._userId) {
          removeCustomItemAction(itemId).catch(console.error);
        }
      },
      pendingImportedRecipe: null,
      setPendingImportedRecipe: (recipe) => set({ pendingImportedRecipe: recipe }),
      // Sync state
      _userId: null,
      _setUserId: (userId) => set({ _userId: userId }),
      _isSyncing: false,
      _setIsSyncing: (syncing) => set({ _isSyncing: syncing }),
    }),
    {
      name: 'food-plan-storage',
      partialize: (state) => ({
        currentPlan: state.currentPlan,
        checkedItems: state.checkedItems,
        userRecipes: state.userRecipes,
        customShoppingItems: state.customShoppingItems,
        // Note: pendingImportedRecipe, _userId, _isSyncing are intentionally NOT persisted
      }),
      skipHydration: true,
    }
  )
);

// Default preferences
export const defaultPreferences: MealPlanPreferences = {
  startDay: 5, // Saturday (0=Monday ... 5=Saturday, 6=Sunday)
};
