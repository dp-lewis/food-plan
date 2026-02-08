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
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

/**
 * Get ordered day names starting from the plan's startDay.
 * startDay: 0=Monday, 1=Tuesday, ... 6=Sunday
 */
function getOrderedDays(startDay: number): string[] {
  return Array.from({ length: 7 }, (_, i) => DAYS[(startDay + i) % 7]);
}

type DrawerMode = 'swap' | 'add';

interface DrawerState {
  isOpen: boolean;
  mode: DrawerMode;
  mealId: string | null;
  dayIndex: number | null;
  mealType: MealType | null;
  currentRecipeId: string | null;
  excludeRecipeIds: string[];
}

export default function CurrentPlan() {
  const router = useRouter();
  const currentPlan = useStore((state) => state.currentPlan);
  const swapMeal = useStore((state) => state.swapMeal);
  const addMeal = useStore((state) => state.addMeal);
  const removeMeal = useStore((state) => state.removeMeal);
  const userRecipes = useStore((state) => state.userRecipes);

  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    mode: 'swap',
    mealId: null,
    dayIndex: null,
    mealType: null,
    currentRecipeId: null,
    excludeRecipeIds: [],
  });

  const openSwapDrawer = (mealId: string, mealType: MealType, currentRecipeId: string) => {
    setDrawerState({
      isOpen: true,
      mode: 'swap',
      mealId,
      dayIndex: null,
      mealType,
      currentRecipeId,
      excludeRecipeIds: [],
    });
  };

  const openAddDrawer = (dayIndex: number, mealType: MealType, excludeRecipeIds: string[]) => {
    setDrawerState({
      isOpen: true,
      mode: 'add',
      mealId: null,
      dayIndex,
      mealType,
      currentRecipeId: null,
      excludeRecipeIds,
    });
  };

  const closeDrawer = () => {
    setDrawerState({
      isOpen: false,
      mode: 'swap',
      mealId: null,
      dayIndex: null,
      mealType: null,
      currentRecipeId: null,
      excludeRecipeIds: [],
    });
  };

  const handleSelectRecipe = (recipeId: string) => {
    if (drawerState.mode === 'swap' && drawerState.mealId) {
      swapMeal(drawerState.mealId, recipeId);
    } else if (drawerState.mode === 'add' && drawerState.dayIndex !== null && drawerState.mealType) {
      addMeal(drawerState.dayIndex, drawerState.mealType, recipeId);
    }
  };

  const handleSurpriseMe = () => {
    if (drawerState.mode === 'swap' && drawerState.mealId) {
      swapMeal(drawerState.mealId);
    } else if (drawerState.mode === 'add' && drawerState.dayIndex !== null && drawerState.mealType) {
      // Pick a random recipe from available ones
      const availableRecipes = getRecipesByMealType(drawerState.mealType, userRecipes)
        .filter(r => !drawerState.excludeRecipeIds.includes(r.id));
      if (availableRecipes.length > 0) {
        const randomRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
        addMeal(drawerState.dayIndex, drawerState.mealType, randomRecipe.id);
      }
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
        .filter(r => !drawerState.excludeRecipeIds.includes(r.id))
    : [];

  const { preferences } = currentPlan;
  const orderedDays = getOrderedDays(preferences.startDay);

  // Build 7 days × 3 meal slots
  const slotsByDay = orderedDays.map((dayName, dayIndex) => {
    const slots = MEAL_TYPES.map(mealType => ({
      mealType,
      meals: currentPlan.meals.filter(
        m => m.dayIndex === dayIndex && m.mealType === mealType
      ),
    }));
    return { dayName, dayIndex, slots };
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
            Change start day
          </Link>
        </div>

        <div className="space-y-4">
          {slotsByDay.map(({ dayName, dayIndex, slots }) => (
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
                {slots.map(({ mealType, meals }) => {
                  const slotRecipeIds = meals.map(m => m.recipeId);

                  return (
                    <div key={mealType} data-testid={`slot-${dayIndex}-${mealType}`}>
                      {/* Meal type header */}
                      <div
                        className="px-4 pt-3 pb-1"
                        style={{
                          fontSize: 'var(--font-size-caption)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        <span className="uppercase tracking-wide">{mealType}</span>
                      </div>

                      {/* Meals in this slot */}
                      {meals.length === 0 ? (
                        <div
                          className="px-4 pb-3 flex items-center justify-between"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <span
                            style={{
                              fontSize: 'var(--font-size-body)',
                              fontStyle: 'italic',
                            }}
                          >
                            No meals planned
                          </span>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => openAddDrawer(dayIndex, mealType, slotRecipeIds)}
                            data-testid={`add-meal-${dayIndex}-${mealType}`}
                            aria-label={`Add ${mealType}`}
                          >
                            + Add
                          </Button>
                        </div>
                      ) : (
                        <>
                          {meals.map((meal) => {
                            const recipe = getRecipeById(meal.recipeId, userRecipes);
                            if (!recipe) return null;

                            const recipeUrl = recipe.isUserRecipe
                              ? `/recipes/${recipe.id}`
                              : `/recipe/${recipe.id}`;

                            return (
                              <div
                                key={meal.id}
                                className="flex items-center justify-between px-4 py-2"
                                data-testid={`meal-${meal.id}`}
                              >
                                <Link
                                  href={recipeUrl}
                                  className="flex-1 transition-colors"
                                >
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
                                  variant="ghost"
                                  size="small"
                                  onClick={() => removeMeal(meal.id)}
                                  data-testid={`remove-meal-${meal.id}`}
                                  aria-label={`Remove ${recipe.title}`}
                                >
                                  Remove
                                </Button>
                              </div>
                            );
                          })}
                          {/* Add button after existing meals */}
                          <div className="px-4 pb-3">
                            <Button
                              variant="ghost"
                              size="small"
                              onClick={() => openAddDrawer(dayIndex, mealType, slotRecipeIds)}
                              data-testid={`add-meal-${dayIndex}-${mealType}`}
                              aria-label={`Add ${mealType}`}
                              style={{ color: 'var(--color-accent)' }}
                            >
                              + Add {mealType}
                            </Button>
                          </div>
                        </>
                      )}
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
        mode={drawerState.mode}
      />
    </main>
  );
}
