'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MealPlan, MealPlanPreferences } from '@/types';

interface AppState {
  currentPlan: MealPlan | null;
  setCurrentPlan: (plan: MealPlan | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentPlan: null,
      setCurrentPlan: (plan) => set({ currentPlan: plan }),
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
