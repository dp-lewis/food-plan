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
 * Determine which meal is "up next" based on the current hour.
 * Returns the next meal the user needs to cook, looking into tomorrow if today is done.
 */
function getUpNextMeal(
  todayIndex: number,
  numberOfDays: number,
  meals: Meal[],
  hour: number
): { meal: Meal; label: string } | null {
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

  const dayMeals = meals
    .filter((m) => m.dayIndex === dayIndex)
    .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));

  // Find the first meal that matches our candidate types
  for (const mt of candidateMealTypes) {
    const found = dayMeals.find((m) => m.mealType === mt);
    if (found) return { meal: found, label };
  }

  // Fallback: if we're looking at today and nothing matched, try tomorrow
  if (dayIndex === todayIndex) {
    const tomorrowIndex = todayIndex + 1;
    if (tomorrowIndex < numberOfDays) {
      const tomorrowMeals = meals
        .filter((m) => m.dayIndex === tomorrowIndex)
        .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));
      if (tomorrowMeals.length > 0) {
        return { meal: tomorrowMeals[0], label: 'Tomorrow' };
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
    const todayDow = now.getDay();
    const adjustedTodayIndex = todayDow === 0 ? 6 : todayDow - 1;
    const todayIndex = Math.min(adjustedTodayIndex, currentPlan.preferences.numberOfDays - 1);
    const hour = now.getHours();

    // Up next meal
    const upNext = getUpNextMeal(todayIndex, currentPlan.preferences.numberOfDays, currentPlan.meals, hour);
    const upNextRecipe = upNext ? getRecipeById(upNext.meal.recipeId, userRecipes) : null;
    const upNextRecipeUrl = upNextRecipe
      ? upNextRecipe.isUserRecipe ? `/recipes/${upNextRecipe.id}` : `/recipe/${upNextRecipe.id}`
      : null;

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
    } else if (upNextRecipeUrl) {
      primaryAction = { href: upNextRecipeUrl, label: 'View Recipe' };
    } else {
      primaryAction = { href: '/plan/current', label: 'View Full Plan' };
    }

    return (
      <main id="main-content" className="min-h-screen p-4 pb-20" data-testid="dashboard">
        <div className="max-w-md mx-auto">

          {/* ── Section 1: Up Next ── */}
          {upNextRecipe && upNextRecipeUrl && upNext && (
            <Card data-testid="up-next-card" className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="uppercase tracking-wide"
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {upNext.label}
                </span>
                <span
                  className="uppercase tracking-wide"
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {upNext.meal.mealType}
                </span>
              </div>
              <Link href={upNextRecipeUrl} data-testid="up-next-recipe-link">
                <h1
                  className="mb-1"
                  style={{
                    fontSize: 'var(--font-size-heading)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {upNextRecipe.title}
                </h1>
                <p
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {upNextRecipe.prepTime + upNextRecipe.cookTime} mins
                </p>
              </Link>
              <div className="mt-3">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => openDrawer(upNext.meal.id, upNext.meal.mealType, upNext.meal.recipeId)}
                  data-testid="up-next-swap-btn"
                  aria-label={`Swap ${upNext.meal.mealType}: ${upNextRecipe.title}`}
                >
                  Swap
                </Button>
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
                Tomorrow &middot; {DAYS[tomorrowIndex]}
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
