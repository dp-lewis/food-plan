'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { getRecipeById, getRecipesByMealType } from '@/data/recipes';
import { generateShoppingList, mergeShoppingLists } from '@/lib/shoppingList';
import { MealType, Meal } from '@/types';
import RecipeDrawer from '@/components/RecipeDrawer';
import { Card, Button, BottomNav, ProgressBar } from '@/components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner'];

/**
 * Calculate which day of the plan "today" is, based on plan creation date.
 * Day 0 = the day the plan was created.
 */
function getPlanDayIndex(planCreatedAt: string): number {
  const created = new Date(planCreatedAt);
  const now = new Date();

  // Reset both to start of day for accurate day difference
  const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = todayDay.getTime() - createdDay.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Get the actual day name for a plan day index, based on when the plan was created.
 */
function getDayNameForPlanDay(planCreatedAt: string, dayIndex: number): string {
  const created = new Date(planCreatedAt);
  const targetDate = new Date(created);
  targetDate.setDate(created.getDate() + dayIndex);

  return DAYS[targetDate.getDay() === 0 ? 6 : targetDate.getDay() - 1];
}

/**
 * Determine which slot is "up next" based on the current hour.
 * Returns all meals for the next slot the user needs to cook.
 */
function getUpNextSlot(
  todayIndex: number,
  numberOfDays: number,
  meals: Meal[],
  hour: number
): { meals: Meal[]; mealType: MealType; label: string } | null {
  // Map hour ranges to the earliest meal type the user still needs to cook
  // Before 11am → next is lunch (breakfast assumed done/in-progress)
  // 11am-3pm → next is dinner
  // After 3pm → next is tomorrow's first meal
  let candidateMealTypes: MealType[];
  let dayIndex = todayIndex;
  let label = 'Up next';

  if (hour < 11) {
    candidateMealTypes = ['lunch', 'dinner'];
  } else if (hour < 15) {
    candidateMealTypes = ['dinner'];
  } else {
    // Look at tomorrow
    dayIndex = todayIndex + 1;
    if (dayIndex >= numberOfDays) {
      // Past the last planned day — show nothing
      return null;
    }
    candidateMealTypes = ['breakfast', 'lunch', 'dinner'];
    label = 'Tomorrow';
  }

  const dayMeals = meals.filter((m) => m.dayIndex === dayIndex);

  // Find all meals for the first slot that has meals
  for (const mt of candidateMealTypes) {
    const slotMeals = dayMeals.filter((m) => m.mealType === mt);
    if (slotMeals.length > 0) {
      return { meals: slotMeals, mealType: mt, label };
    }
  }

  // Fallback: if we're looking at today and nothing matched, try tomorrow
  if (dayIndex === todayIndex) {
    const tomorrowIndex = todayIndex + 1;
    if (tomorrowIndex < numberOfDays) {
      const tomorrowMeals = meals.filter((m) => m.dayIndex === tomorrowIndex);
      for (const mt of MEAL_ORDER) {
        const slotMeals = tomorrowMeals.filter((m) => m.mealType === mt);
        if (slotMeals.length > 0) {
          return { meals: slotMeals, mealType: mt, label: 'Tomorrow' };
        }
      }
    }
  }

  return null;
}

interface DrawerState {
  isOpen: boolean;
  mealId: string | null;
  mealType: MealType | null;
  currentRecipeId: string | null;
}

export default function Dashboard() {
  const currentPlan = useStore((state) => state.currentPlan);
  const userRecipes = useStore((state) => state.userRecipes);
  const checkedItems = useStore((state) => state.checkedItems);
  const customShoppingItems = useStore((state) => state.customShoppingItems);
  const swapMeal = useStore((state) => state.swapMeal);

  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    mealId: null,
    mealType: null,
    currentRecipeId: null,
  });

  const openDrawer = (mealId: string, mealType: MealType, currentRecipeId: string) => {
    setDrawerState({ isOpen: true, mealId, mealType, currentRecipeId });
  };

  const closeDrawer = () => {
    setDrawerState({ isOpen: false, mealId: null, mealType: null, currentRecipeId: null });
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

  const drawerRecipes = drawerState.mealType
    ? getRecipesByMealType(drawerState.mealType, userRecipes)
    : [];

  // Compute shopping list status
  const shoppingStatus = useMemo(() => {
    if (!currentPlan) return null;
    const generated = generateShoppingList(currentPlan, userRecipes);
    const allItems = mergeShoppingLists(generated, customShoppingItems);
    const total = allItems.length;
    const checked = allItems.filter((item) => checkedItems.includes(item.id)).length;
    return { total, checked };
  }, [currentPlan, userRecipes, customShoppingItems, checkedItems]);

  // ─── Active plan state ───
  if (currentPlan) {
    const now = new Date();
    const rawTodayIndex = getPlanDayIndex(currentPlan.createdAt);
    const todayIndex = Math.min(rawTodayIndex, currentPlan.preferences.numberOfDays - 1);
    const hour = now.getHours();

    // If we're past the last day of the plan, show nothing (plan expired)
    const planExpired = rawTodayIndex >= currentPlan.preferences.numberOfDays;

    // Up next slot (may have multiple meals)
    const upNextSlot = getUpNextSlot(todayIndex, currentPlan.preferences.numberOfDays, currentPlan.meals, hour);
    const upNextMealsWithRecipes = upNextSlot
      ? upNextSlot.meals
          .map(meal => ({ meal, recipe: getRecipeById(meal.recipeId, userRecipes) }))
          .filter((item): item is { meal: Meal; recipe: NonNullable<ReturnType<typeof getRecipeById>> } => item.recipe !== undefined)
      : [];
    const hasUpNext = upNextMealsWithRecipes.length > 0;

    // Tomorrow's meals (for the preview line)
    const tomorrowIndex = todayIndex + 1;
    const showTomorrow = hour < 15 && tomorrowIndex < currentPlan.preferences.numberOfDays;
    const tomorrowMeals = showTomorrow
      ? currentPlan.meals
          .filter((m) => m.dayIndex === tomorrowIndex)
          .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType))
      : [];

    // Shopping status
    const shoppingDone = shoppingStatus && shoppingStatus.checked >= shoppingStatus.total;
    const shoppingStarted = shoppingStatus && shoppingStatus.checked > 0;

    // Context-aware primary action
    let primaryAction: { href: string; label: string };
    if (!shoppingStarted && shoppingStatus && shoppingStatus.total > 0) {
      primaryAction = { href: '/shopping-list', label: 'Go Shopping' };
    } else if (hasUpNext && upNextMealsWithRecipes.length === 1) {
      const firstRecipe = upNextMealsWithRecipes[0].recipe;
      const recipeUrl = firstRecipe.isUserRecipe ? `/recipes/${firstRecipe.id}` : `/recipe/${firstRecipe.id}`;
      primaryAction = { href: recipeUrl, label: 'View Recipe' };
    } else if (hasUpNext) {
      primaryAction = { href: '/plan/current', label: 'View Recipes' };
    } else {
      primaryAction = { href: '/plan/current', label: 'View Full Plan' };
    }

    return (
      <main id="main-content" className="min-h-screen p-4 pb-20" data-testid="dashboard">
        <div className="max-w-md mx-auto">

          {/* ── Section 1: Up Next ── */}
          {hasUpNext && upNextSlot && (
            <Card data-testid="up-next-card" className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="uppercase tracking-wide"
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {upNextSlot.label}
                </span>
                <span
                  className="uppercase tracking-wide"
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {upNextSlot.mealType}
                </span>
              </div>
              <div className="space-y-3">
                {upNextMealsWithRecipes.map(({ meal, recipe }, index) => {
                  const recipeUrl = recipe.isUserRecipe ? `/recipes/${recipe.id}` : `/recipe/${recipe.id}`;
                  const isFirst = index === 0;
                  return (
                    <div key={meal.id} data-testid={`up-next-meal-${meal.id}`}>
                      <Link href={recipeUrl} data-testid={isFirst ? 'up-next-recipe-link' : undefined}>
                        <p
                          className="mb-1"
                          style={{
                            fontSize: isFirst ? 'var(--font-size-heading)' : 'var(--font-size-body)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text-primary)',
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
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ── Section 2: Tomorrow preview ── */}
          {showTomorrow && tomorrowMeals.length > 0 && (
            <Card data-testid="tomorrow-preview" className="mb-4">
              <h2
                className="mb-2"
                style={{
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Tomorrow &middot; {getDayNameForPlanDay(currentPlan.createdAt, tomorrowIndex)}
              </h2>
              <div className="space-y-1">
                {tomorrowMeals.map((meal) => {
                  const recipe = getRecipeById(meal.recipeId, userRecipes);
                  if (!recipe) return null;
                  return (
                    <div
                      key={meal.id}
                      className="flex items-baseline gap-2"
                      style={{ fontSize: 'var(--font-size-body)' }}
                    >
                      <span
                        className="uppercase"
                        style={{
                          fontSize: 'var(--font-size-caption)',
                          color: 'var(--color-text-muted)',
                          minWidth: '4.5rem',
                        }}
                      >
                        {meal.mealType}
                      </span>
                      <span style={{ color: 'var(--color-text-primary)' }}>
                        {recipe.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ── Section 3: Shopping list status ── */}
          {shoppingStatus && shoppingStatus.total > 0 && (
            <Link href="/shopping-list" data-testid="shopping-status-link">
              <Card className="mb-4" data-testid="shopping-status-card">
                {shoppingDone ? (
                  <p
                    style={{
                      fontSize: 'var(--font-size-body)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    Shopping complete
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        style={{
                          fontSize: 'var(--font-size-body)',
                          fontWeight: 'var(--font-weight-bold)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Shopping list
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--font-size-caption)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {shoppingStatus.checked} of {shoppingStatus.total} items
                      </span>
                    </div>
                    <ProgressBar
                      value={shoppingStatus.checked}
                      max={shoppingStatus.total}
                      label={`Shopping progress: ${shoppingStatus.checked} of ${shoppingStatus.total} items`}
                    />
                  </>
                )}
              </Card>
            </Link>
          )}

          {/* ── Section 4: Quick actions ── */}
          <div className="flex gap-2">
            <Link href={primaryAction.href} className="flex-1" data-testid="primary-action-link">
              <Button className="w-full">{primaryAction.label}</Button>
            </Link>
            <Link href="/plan/current" className="flex-1" data-testid="view-full-plan-link">
              <Button variant="secondary" className="w-full">Full Plan</Button>
            </Link>
          </div>
        </div>

        <BottomNav
          showBack={false}
          secondaryAction={{ href: '/recipes', label: 'Recipes', testId: 'my-recipes-link' }}
          primaryAction={{ href: '/plan', label: 'New Plan', testId: 'new-plan-link' }}
        />

        {/* Recipe swap drawer */}
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

  // ─── Empty state: no plan yet ───
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center px-4 pb-20" data-testid="empty-state">
      <div className="max-w-md w-full text-center">
        <h1
          className="mb-2"
          style={{
            fontSize: 'var(--font-size-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
          }}
        >
          What&apos;s for dinner this week?
        </h1>
        <p
          className="mb-8"
          style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-text-muted)',
          }}
        >
          Create a plan and we&apos;ll sort out your shopping list.
        </p>
        <Link href="/plan" data-testid="create-first-plan-btn">
          <Button className="w-full">Create Your Plan</Button>
        </Link>
      </div>

      <BottomNav
        showBack={false}
        primaryAction={{ href: '/recipes', label: 'Recipes', testId: 'my-recipes-link' }}
      />
    </main>
  );
}
