'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, defaultPreferences } from '@/store/store';
import { generateMealPlan } from '@/lib/planGenerator';
import { MealPlanPreferences } from '@/types';
import { BackLink, Stepper, ToggleGroup, Button } from '@/components/ui';

export default function CreatePlan() {
  const router = useRouter();
  const setCurrentPlan = useStore((state) => state.setCurrentPlan);
  const userRecipes = useStore((state) => state.userRecipes);

  const [preferences, setPreferences] = useState<MealPlanPreferences>(defaultPreferences);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plan = generateMealPlan(preferences, userRecipes);
    setCurrentPlan(plan);
    router.push('/plan/current');
  };

  const dayOptions = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
    value: String(day),
    label: String(day),
  }));

  const mealOptions = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
  ];

  const selectedMeals = Object.entries(preferences.includeMeals)
    .filter(([, included]) => included)
    .map(([meal]) => meal);

  return (
    <main id="main-content" className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        <BackLink href="/" />

        <h1
          className="mb-2"
          style={{
            fontSize: 'var(--font-size-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          Create Meal Plan
        </h1>

        <p
          className="mb-6"
          style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-text-muted)',
          }}
        >
          Set your preferences and we&apos;ll generate a plan for you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Stepper
            label="Number of people"
            value={preferences.numberOfPeople}
            onChange={(value) => setPreferences((p) => ({ ...p, numberOfPeople: value }))}
            min={1}
            max={12}
            testId="people"
          />

          <ToggleGroup
            label="Days to plan"
            options={dayOptions}
            value={String(preferences.numberOfDays)}
            onChange={(value) =>
              setPreferences((p) => ({ ...p, numberOfDays: Number(value) }))
            }
            variant="compact"
            testIdPrefix="day"
          />

          <ToggleGroup
            label="Meals to include"
            options={mealOptions}
            value={selectedMeals}
            onChange={(values) => {
              const mealsArray = Array.isArray(values) ? values : [values];
              setPreferences((p) => ({
                ...p,
                includeMeals: {
                  breakfast: mealsArray.includes('breakfast'),
                  lunch: mealsArray.includes('lunch'),
                  dinner: mealsArray.includes('dinner'),
                },
              }));
            }}
            multiple
            testIdPrefix="meal"
          />

          <Button type="submit" className="w-full" data-testid="generate-plan-btn">
            Generate Plan
          </Button>
        </form>
      </div>
    </main>
  );
}
