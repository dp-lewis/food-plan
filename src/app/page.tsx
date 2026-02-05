'use client';

import Link from 'next/link';
import { useStore } from '@/store/store';
import { getRecipeById } from '@/data/recipes';
import { Card, Button, EmptyState } from '@/components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Dashboard() {
  const currentPlan = useStore((state) => state.currentPlan);
  const userRecipes = useStore((state) => state.userRecipes);

  // Show plan summary if one exists
  if (currentPlan) {
    const todayIndex = new Date().getDay();
    // Convert Sunday=0 to our Monday=0 format
    const adjustedTodayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
    const todayMeals = currentPlan.meals.filter(
      (m) => m.dayIndex === Math.min(adjustedTodayIndex, currentPlan.preferences.numberOfDays - 1)
    );

    return (
      <main id="main-content" className="min-h-screen p-4" data-testid="dashboard">
        <div className="max-w-md mx-auto">
          <h1
            className="mb-6"
            style={{
              fontSize: 'var(--font-size-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            This Week&apos;s Plan
          </h1>

          {/* Today's meals */}
          <Card data-testid="today-meals" className="mb-4">
            <h2
              className="mb-3"
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Today &middot; {DAYS[Math.min(adjustedTodayIndex, currentPlan.preferences.numberOfDays - 1)]}
            </h2>
            <div className="space-y-2">
              {todayMeals.map((meal) => {
                const recipe = getRecipeById(meal.recipeId, userRecipes);
                if (!recipe) return null;
                const recipeUrl = recipe.isUserRecipe
                  ? `/recipes/${recipe.id}`
                  : `/recipe/${recipe.id}`;
                return (
                  <Link
                    key={meal.id}
                    href={recipeUrl}
                    className="flex justify-between items-center py-1 -mx-1 px-1 rounded transition-colors"
                    style={{ minHeight: 'var(--touch-target-min)' }}
                  >
                    <div>
                      <span
                        className="uppercase tracking-wide mr-2"
                        style={{
                          fontSize: 'var(--font-size-caption)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {meal.mealType}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--font-size-body)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {recipe.title}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-text-muted)',
                      }}
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Quick actions */}
          <div className="space-y-3">
            <Link href="/plan/current" data-testid="view-full-plan-link">
              <Button variant="secondary" className="w-full">
                View Full Plan
              </Button>
            </Link>
            <Link href="/shopping-list" data-testid="shopping-list-link" className="mt-2 block">
              <Button className="w-full">
                Shopping List
              </Button>
            </Link>
            <Link
              href="/plan"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
              className="block text-center mt-4"
            >
              Create new plan
            </Link>
            <Link
              href="/recipes"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
              className="block text-center mt-2"
              data-testid="my-recipes-link"
            >
              My Recipes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Empty state for new users
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center px-4" data-testid="empty-state">
      <div className="max-w-md w-full">
        <EmptyState
          icon="🍽️"
          title="Plan your meals for the week"
          description="Generate a weekly meal plan, get recipes, and create a shopping list — all in one place."
          action={
            <Link href="/plan" data-testid="create-first-plan-btn">
              <Button className="w-full">Create Your First Plan</Button>
            </Link>
          }
        />

        {/* Features list */}
        <ul
          className="mt-8 text-left space-y-3"
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-text-muted)',
          }}
        >
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--color-accent)' }}>✓</span>
            <span>Personalised meal plans based on your preferences</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--color-accent)' }}>✓</span>
            <span>Auto-generated shopping lists grouped by aisle</span>
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: 'var(--color-accent)' }}>✓</span>
            <span>Easy meal swapping when plans change</span>
          </li>
        </ul>

        <Link
          href="/recipes"
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-text-muted)',
          }}
          className="block text-center mt-6"
          data-testid="my-recipes-link"
        >
          Import your own recipes →
        </Link>
      </div>
    </main>
  );
}
