'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MealPlan, MealPlanPreferences } from '@/types';

interface AppState {
  currentPlan: MealPlan | null;
  setCurrentPlan: (plan: MealPlan | null) => void;
  checkedItems: string[];
  toggleCheckedItem: (itemId: string) => void;
  clearCheckedItems: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentPlan: null,
      setCurrentPlan: (plan) => set({ currentPlan: plan, checkedItems: [] }),
      checkedItems: [],
      toggleCheckedItem: (itemId) =>
        set((state) => ({
          checkedItems: state.checkedItems.includes(itemId)
            ? state.checkedItems.filter((id) => id !== itemId)
            : [...state.checkedItems, itemId],
        })),
      clearCheckedItems: () => set({ checkedItems: [] }),
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
