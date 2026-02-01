'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { getRecipeById } from '@/data/recipes';
import { MealType } from '@/types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner'];

export default function CurrentPlan() {
  const router = useRouter();
  const currentPlan = useStore((state) => state.currentPlan);

  useEffect(() => {
    if (!currentPlan) {
      router.push('/');
    }
  }, [currentPlan, router]);

  if (!currentPlan) {
    return null;
  }

  // Group meals by day
  const mealsByDay = DAYS.slice(0, currentPlan.preferences.numberOfDays).map((dayName, dayIndex) => {
    const dayMeals = currentPlan.meals
      .filter((m) => m.dayIndex === dayIndex)
      .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));
    return { dayName, dayIndex, meals: dayMeals };
  });

  return (
    <main className="min-h-screen p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1
            style={{
              fontSize: 'var(--font-size-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            Your Meal Plan
          </h1>
          <Link
            href="/plan"
            style={{
              fontSize: 'var(--font-size-caption)',
              color: 'var(--color-accent)',
            }}
          >
            Edit preferences
          </Link>
        </div>

        <div className="space-y-4">
          {mealsByDay.map(({ dayName, meals }) => (
            <div
              key={dayName}
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: 'var(--border-width) solid var(--color-border)',
              }}
            >
              <div
                className="px-4 py-2"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: 'var(--font-size-body)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {dayName}
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {meals.map((meal) => {
                  const recipe = getRecipeById(meal.recipeId);
                  if (!recipe) return null;

                  return (
                    <Link
                      key={meal.id}
                      href={`/recipe/${recipe.id}`}
                      className="block px-4 py-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className="uppercase tracking-wide"
                            style={{
                              fontSize: 'var(--font-size-caption)',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            {meal.mealType}
                          </span>
                          <p
                            style={{
                              fontSize: 'var(--font-size-body)',
                              color: 'var(--color-text-primary)',
                              fontWeight: 'var(--font-weight-bold)',
                            }}
                          >
                            {recipe.title}
                          </p>
                          <p
                            style={{
                              fontSize: 'var(--font-size-caption)',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            {recipe.prepTime + recipe.cookTime} mins
                          </p>
                        </div>
                        <span
                          style={{
                            color: 'var(--color-text-muted)',
                            fontSize: 'var(--font-size-body)',
                          }}
                        >
                          →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom action bar */}
        <div
          className="fixed bottom-0 left-0 right-0 p-4"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            borderTop: 'var(--border-width) solid var(--color-border)',
          }}
        >
          <div className="max-w-2xl mx-auto">
            <Link
              href="/shopping-list"
              className="primary-button w-full inline-flex items-center justify-center"
            >
              View Shopping List
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
