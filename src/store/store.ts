'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MealPlan, MealPlanPreferences, Recipe, CustomShoppingListItem, Meal, MealType, PlanRole } from '@/types';
import { swapMeal as swapMealInPlan } from '@/lib/planGenerator';
import { categorizeIngredient } from '@/lib/ingredientParser';
import { getRecipeById } from '@/data/recipes';
import { ParsedRecipe } from '@/lib/recipeParser';
import { generateUUID } from '@/lib/uuid';

// ---------------------------------------------------------------------------
// Sync intent types — each represents one server-side operation to perform
// ---------------------------------------------------------------------------

export type SyncIntent =
  | { type: 'syncMealPlan'; plan: MealPlan }
  | { type: 'clearCheckedItems'; planId: string }
  | { type: 'swapMeal'; mealId: string; recipeId: string }
  | { type: 'addMeal'; planId: string; meal: Meal }
  | { type: 'removeMeal'; mealId: string }
  | { type: 'toggleCheckedItem'; planId: string; itemId: string; checked: boolean }
  | { type: 'saveUserRecipe'; recipe: Recipe }
  | { type: 'deleteUserRecipe'; recipeId: string }
  | { type: 'addCustomItem'; planId: string; item: CustomShoppingListItem }
  | { type: 'removeCustomItem'; itemId: string };

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
  _planRole: PlanRole | null;
  _setPlanRole: (role: PlanRole | null) => void;
  _userId: string | null;
  _setUserId: (userId: string | null) => void;
  _isSyncing: boolean;
  _setIsSyncing: (syncing: boolean) => void;
  _syncQueue: SyncIntent[];
  _pushSync: (intent: SyncIntent) => void;
  _drainSync: () => SyncIntent[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPlan: null,
      setCurrentPlan: (plan) => {
        set({ currentPlan: plan, checkedItems: [] });
        if (plan) {
          get()._pushSync({ type: 'syncMealPlan', plan });
          get()._pushSync({ type: 'clearCheckedItems', planId: plan.id });
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
        const updatedPlan = get().currentPlan;
        if (updatedPlan) {
          const updatedMeal = updatedPlan.meals.find((m) => m.id === mealId);
          if (updatedMeal?.recipeId) {
            get()._pushSync({ type: 'swapMeal', mealId, recipeId: updatedMeal.recipeId });
          }
          get()._pushSync({ type: 'clearCheckedItems', planId: updatedPlan.id });
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

        const planId = state.currentPlan.id;
        set({
          currentPlan: {
            ...state.currentPlan,
            meals: [...state.currentPlan.meals, newMeal],
          },
          checkedItems: [],
        });
        get()._pushSync({ type: 'addMeal', planId, meal: newMeal });
        get()._pushSync({ type: 'clearCheckedItems', planId });
      },
      removeMeal: (mealId) => {
        const state = get();
        if (!state.currentPlan) return;

        const planId = state.currentPlan.id;
        set({
          currentPlan: {
            ...state.currentPlan,
            meals: state.currentPlan.meals.filter(m => m.id !== mealId),
          },
          checkedItems: [],
        });
        get()._pushSync({ type: 'removeMeal', mealId });
        get()._pushSync({ type: 'clearCheckedItems', planId });
      },
      checkedItems: [],
      toggleCheckedItem: (itemId) => {
        set((state) => ({
          checkedItems: state.checkedItems.includes(itemId)
            ? state.checkedItems.filter((id) => id !== itemId)
            : [...state.checkedItems, itemId],
        }));
        const planId = get().currentPlan?.id;
        if (planId) {
          const checked = get().checkedItems.includes(itemId);
          get()._pushSync({ type: 'toggleCheckedItem', planId, itemId, checked });
        }
      },
      clearCheckedItems: () => {
        set({ checkedItems: [] });
        const planId = get().currentPlan?.id;
        if (planId) {
          get()._pushSync({ type: 'clearCheckedItems', planId });
        }
      },
      userRecipes: [],
      addUserRecipe: (recipe) => {
        set((state) => ({
          userRecipes: [...state.userRecipes, recipe],
        }));
        get()._pushSync({ type: 'saveUserRecipe', recipe });
      },
      removeUserRecipe: (id) => {
        set((state) => ({
          userRecipes: state.userRecipes.filter((r) => r.id !== id),
        }));
        get()._pushSync({ type: 'deleteUserRecipe', recipeId: id });
      },
      customShoppingItems: [],
      addCustomItem: (ingredient, quantity = 1, unit = '') => {
        const newItem: CustomShoppingListItem = {
          id: `custom-${generateUUID()}`,
          ingredient,
          quantity,
          unit,
          category: categorizeIngredient(ingredient),
        };
        set((state) => ({
          customShoppingItems: [...state.customShoppingItems, newItem],
        }));
        const planId = get().currentPlan?.id;
        if (planId) {
          get()._pushSync({ type: 'addCustomItem', planId, item: newItem });
        }
      },
      removeCustomItem: (itemId) => {
        set((state) => ({
          customShoppingItems: state.customShoppingItems.filter((item) => item.id !== itemId),
        }));
        get()._pushSync({ type: 'removeCustomItem', itemId });
      },
      pendingImportedRecipe: null,
      setPendingImportedRecipe: (recipe) => set({ pendingImportedRecipe: recipe }),
      // Sync state
      _planRole: null,
      _setPlanRole: (role) => set({ _planRole: role }),
      _userId: null,
      _setUserId: (userId) => set({ _userId: userId }),
      _isSyncing: false,
      _setIsSyncing: (syncing) => set({ _isSyncing: syncing }),
      _syncQueue: [],
      _pushSync: (intent) => set((state) => ({ _syncQueue: [...state._syncQueue, intent] })),
      _drainSync: () => {
        const queue = get()._syncQueue;
        if (queue.length > 0) {
          set({ _syncQueue: [] });
        }
        return queue;
      },
    }),
    {
      name: 'food-plan-storage',
      partialize: (state) => ({
        currentPlan: state.currentPlan,
        checkedItems: state.checkedItems,
        userRecipes: state.userRecipes,
        customShoppingItems: state.customShoppingItems,
        // Note: pendingImportedRecipe, _userId, _isSyncing, _syncQueue are intentionally NOT persisted
      }),
      skipHydration: true,
    }
  )
);

// Default preferences
export const defaultPreferences: MealPlanPreferences = {
  startDay: 5, // Saturday (0=Monday ... 5=Saturday, 6=Sunday)
};
