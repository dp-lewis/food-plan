'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore, defaultPreferences } from '@/store/store';
import { generateMealPlan } from '@/lib/planGenerator';
import { MealPlanPreferences, BudgetLevel } from '@/types';

export default function CreatePlan() {
  const router = useRouter();
  const setCurrentPlan = useStore((state) => state.setCurrentPlan);

  const [preferences, setPreferences] = useState<MealPlanPreferences>(defaultPreferences);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plan = generateMealPlan(preferences);
    setCurrentPlan(plan);
    router.push('/plan/current');
  };

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 mb-6"
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-text-muted)',
          }}
        >
          ← Back
        </Link>

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
          {/* Number of people */}
          <div>
            <label
              className="block mb-2"
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Number of people
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setPreferences((p) => ({
                    ...p,
                    numberOfPeople: Math.max(1, p.numberOfPeople - 1),
                  }))
                }
                className="stepper-button"
                data-testid="people-decrement"
              >
                −
              </button>
              <span
                className="w-12 text-center"
                data-testid="people-count"
                style={{
                  fontSize: 'var(--font-size-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                }}
              >
                {preferences.numberOfPeople}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPreferences((p) => ({
                    ...p,
                    numberOfPeople: Math.min(12, p.numberOfPeople + 1),
                  }))
                }
                className="stepper-button"
                data-testid="people-increment"
              >
                +
              </button>
            </div>
          </div>

          {/* Number of days */}
          <div>
            <label
              className="block mb-2"
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Days to plan
            </label>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setPreferences((p) => ({ ...p, numberOfDays: day }))}
                  className={`day-button ${preferences.numberOfDays === day ? 'day-button-active' : ''}`}
                  data-testid={`day-${day}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Meals to include */}
          <div>
            <label
              className="block mb-2"
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Meals to include
            </label>
            <div className="flex gap-2 flex-wrap">
              {(['breakfast', 'lunch', 'dinner'] as const).map((meal) => (
                <button
                  key={meal}
                  type="button"
                  onClick={() =>
                    setPreferences((p) => ({
                      ...p,
                      includeMeals: {
                        ...p.includeMeals,
                        [meal]: !p.includeMeals[meal],
                      },
                    }))
                  }
                  className={`meal-button ${preferences.includeMeals[meal] ? 'meal-button-active' : ''}`}
                  data-testid={`meal-${meal}`}
                >
                  {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label
              className="block mb-2"
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Budget level
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as BudgetLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPreferences((p) => ({ ...p, budget: level }))}
                  className={`budget-button ${preferences.budget === level ? 'budget-button-active' : ''}`}
                  data-testid={`budget-${level}`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="primary-button w-full inline-flex items-center justify-center" data-testid="generate-plan-btn">
            Generate Plan
          </button>
        </form>
      </div>
    </main>
  );
}
