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
  const swapMeal = useStore((state) => state.swapMeal);
  const userRecipes = useStore((state) => state.userRecipes);

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
    <main className="min-h-screen p-4 pb-24" data-testid="meal-plan">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 mb-4"
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-text-muted)',
          }}
        >
          ← Back to Dashboard
        </Link>

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
          {mealsByDay.map(({ dayName, dayIndex, meals }) => (
            <div
              key={dayName}
              className="rounded-lg overflow-hidden"
              data-testid={`day-${dayIndex}`}
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
                  const recipe = getRecipeById(meal.recipeId, userRecipes);
                  if (!recipe) return null;

                  const recipeUrl = recipe.isUserRecipe
                    ? `/recipes/${recipe.id}`
                    : `/recipe/${recipe.id}`;

                  return (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between px-4 py-3"
                      data-testid={`meal-${meal.id}`}
                    >
                      <Link
                        href={recipeUrl}
                        className="flex-1 transition-colors"
                      >
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
                      </Link>
                      <button
                        onClick={() => swapMeal(meal.id)}
                        className="ml-3 px-3 py-1.5 rounded transition-colors"
                        data-testid={`swap-${meal.id}`}
                        style={{
                          fontSize: 'var(--font-size-caption)',
                          color: 'var(--color-accent)',
                          backgroundColor: 'var(--color-bg-tertiary)',
                        }}
                      >
                        Swap
                      </button>
                    </div>
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
              data-testid="shopping-list-btn"
            >
              View Shopping List
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
