'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { getRecipeById, getRecipesByMealType } from '@/data/recipes';
import { MealType } from '@/types';
import RecipeDrawer from '@/components/RecipeDrawer';
import { BottomNav, Button, Card } from '@/components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner'];

interface DrawerState {
  isOpen: boolean;
  mealId: string | null;
  mealType: MealType | null;
  currentRecipeId: string | null;
}

export default function CurrentPlan() {
  const router = useRouter();
  const currentPlan = useStore((state) => state.currentPlan);
  const swapMeal = useStore((state) => state.swapMeal);
  const userRecipes = useStore((state) => state.userRecipes);

  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    mealId: null,
    mealType: null,
    currentRecipeId: null,
  });

  const openDrawer = (mealId: string, mealType: MealType, currentRecipeId: string) => {
    setDrawerState({
      isOpen: true,
      mealId,
      mealType,
      currentRecipeId,
    });
  };

  const closeDrawer = () => {
    setDrawerState({
      isOpen: false,
      mealId: null,
      mealType: null,
      currentRecipeId: null,
    });
  };

  const handleSelectRecipe = (recipeId: string) => {
    if (drawerState.mealId) {
      swapMeal(drawerState.mealId, recipeId);
    }
  };

  const handleSurpriseMe = () => {
    if (drawerState.mealId) {
      swapMeal(drawerState.mealId);
    }
  };

  useEffect(() => {
    if (!currentPlan) {
      router.push('/');
    }
  }, [currentPlan, router]);

  if (!currentPlan) {
    return null;
  }

  const drawerRecipes = drawerState.mealType
    ? getRecipesByMealType(drawerState.mealType, userRecipes)
    : [];

  // Group meals by day
  const mealsByDay = DAYS.slice(0, currentPlan.preferences.numberOfDays).map((dayName, dayIndex) => {
    const dayMeals = currentPlan.meals
      .filter((m) => m.dayIndex === dayIndex)
      .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));
    return { dayName, dayIndex, meals: dayMeals };
  });

  return (
    <main id="main-content" className="min-h-screen p-4 pb-24" data-testid="meal-plan">
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
          {mealsByDay.map(({ dayName, dayIndex, meals }) => (
            <Card key={dayName} padding="none" data-testid={`day-${dayIndex}`}>
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
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => openDrawer(meal.id, meal.mealType, meal.recipeId)}
                        data-testid={`swap-${meal.id}`}
                        aria-label={`Swap ${meal.mealType}: ${recipe.title}`}
                      >
                        Swap
                      </Button>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

      </div>

      <BottomNav
        backHref="/"
        primaryAction={{ href: '/shopping-list', label: 'View Shopping List', testId: 'shopping-list-btn' }}
        maxWidth="2xl"
      />

      {/* Recipe selection drawer */}
      <RecipeDrawer
        isOpen={drawerState.isOpen}
        onClose={closeDrawer}
        mealType={drawerState.mealType}
        currentRecipeId={drawerState.currentRecipeId}
        recipes={drawerRecipes}
        onSelectRecipe={handleSelectRecipe}
        onSurpriseMe={handleSurpriseMe}
      />
    </main>
  );
}
