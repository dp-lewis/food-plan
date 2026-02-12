'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { getRecipeById, getRecipesByMealType } from '@/data/recipes';
import { generateShoppingList, mergeShoppingLists } from '@/lib/shoppingList';
import { MealType, Meal } from '@/types';
import RecipeDrawer from '@/components/RecipeDrawer';
import { Card, Button, BottomNav, ProgressBar } from '@/components/ui';
import Drawer from '@/components/ui/Drawer';
import { useAuth } from '@/components/AuthProvider';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner'];

/**
 * Get today's dayIndex within the plan based on the plan's startDay.
 * startDay uses 0=Monday ... 6=Sunday.
 * Returns 0-6, where 0 is the plan's first day.
 */
function getTodayPlanIndex(startDay: number): number {
  const now = new Date();
  // JS getDay(): 0=Sunday, 1=Monday ... 6=Saturday
  // Convert to our system: 0=Monday ... 6=Sunday
  const jsDay = now.getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
  // How many days from startDay to today (wrapping around the week)
  return (todayIndex - startDay + 7) % 7;
}

/**
 * Get the day name for a plan dayIndex given the startDay.
 */
function getDayName(startDay: number, dayIndex: number): string {
  return DAYS[(startDay + dayIndex) % 7];
}

/**
 * Determine which slot is "up next" based on the current hour.
 */
function getUpNextSlot(
  todayIndex: number,
  meals: Meal[],
  hour: number
): { meals: Meal[]; mealType: MealType; label: string } | null {
  let candidateMealTypes: MealType[];
  let dayIndex = todayIndex;
  let label = 'Up next';

  if (hour < 11) {
    candidateMealTypes = ['breakfast', 'lunch', 'dinner'];
  } else if (hour < 15) {
    candidateMealTypes = ['lunch', 'dinner'];
  } else {
    candidateMealTypes = ['dinner'];
  }

  const dayMeals = meals.filter((m) => m.dayIndex === dayIndex);

  for (const mt of candidateMealTypes) {
    const slotMeals = dayMeals.filter((m) => m.mealType === mt);
    if (slotMeals.length > 0) {
      return { meals: slotMeals, mealType: mt, label };
    }
  }

  // Fallback: if looking at today and nothing matched, try tomorrow
  if (dayIndex === todayIndex) {
    const tomorrowIndex = (todayIndex + 1) % 7;
    const tomorrowMeals = meals.filter((m) => m.dayIndex === tomorrowIndex);
    for (const mt of MEAL_ORDER) {
      const slotMeals = tomorrowMeals.filter((m) => m.mealType === mt);
      if (slotMeals.length > 0) {
        return { meals: slotMeals, mealType: mt, label: 'Tomorrow' };
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
  const { user, loading: authLoading } = useAuth();

  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    mealId: null,
    mealType: null,
    currentRecipeId: null,
  });

  const [signOutDrawerOpen, setSignOutDrawerOpen] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await fetch('/auth/signout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } finally {
      setSignOutLoading(false);
      setSignOutDrawerOpen(false);
    }
  };

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
    const hour = now.getHours();
    const todayIndex = getTodayPlanIndex(currentPlan.preferences.startDay);

    // Up next slot
    const upNextSlot = getUpNextSlot(todayIndex, currentPlan.meals, hour);
    const upNextMealsWithRecipes = upNextSlot
      ? upNextSlot.meals
          .map(meal => ({ meal, recipe: getRecipeById(meal.recipeId, userRecipes) }))
          .filter((item): item is { meal: Meal; recipe: NonNullable<ReturnType<typeof getRecipeById>> } => item.recipe !== undefined)
      : [];
    const hasUpNext = upNextMealsWithRecipes.length > 0;

    // Tomorrow's meals (for the preview line)
    const tomorrowIndex = (todayIndex + 1) % 7;
    const showTomorrow = upNextSlot?.label !== 'Tomorrow';
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

    const tomorrowDayName = getDayName(currentPlan.preferences.startDay, tomorrowIndex);

    return (
      <main id="main-content" className="min-h-screen p-4 pb-20" data-testid="dashboard">
        <div className="max-w-md mx-auto">

          {/* ── Auth header ── */}
          <div className="flex justify-end mb-4" style={{ minHeight: '1.5rem' }}>
            {!authLoading && (
              user ? (
                <button
                  type="button"
                  data-testid="user-menu-btn"
                  onClick={() => setSignOutDrawerOpen(true)}
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {user.email}
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  data-testid="sign-in-link"
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Sign in
                </Link>
              )
            )}
          </div>

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
                Tomorrow &middot; {tomorrowDayName}
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

        {/* Sign out confirmation drawer */}
        <Drawer
          isOpen={signOutDrawerOpen}
          onClose={() => setSignOutDrawerOpen(false)}
          title="Sign out"
        >
          <p
            style={{
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-6)',
            }}
            data-testid="signout-confirmation-text"
          >
            Are you sure you want to sign out?
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setSignOutDrawerOpen(false)}
              data-testid="signout-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={signOutLoading}
              onClick={handleSignOut}
              data-testid="signout-confirm-btn"
            >
              {signOutLoading ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        </Drawer>
      </main>
    );
  }

  // ─── Empty state: no plan yet ───
  return (
    <main id="main-content" className="min-h-screen flex flex-col items-center justify-center px-4 pb-20" data-testid="empty-state">
      <div className="max-w-md w-full">
        {/* ── Auth header ── */}
        <div className="flex justify-end mb-4" style={{ minHeight: '1.5rem' }}>
          {!authLoading && (
            user ? (
              <button
                type="button"
                data-testid="user-menu-btn"
                onClick={() => setSignOutDrawerOpen(true)}
                style={{
                  fontSize: 'var(--font-size-caption)',
                  color: 'var(--color-text-muted)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {user.email}
              </button>
            ) : (
              <Link
                href="/auth/signin"
                data-testid="sign-in-link"
                style={{
                  fontSize: 'var(--font-size-caption)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
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

      {/* Sign out confirmation drawer */}
      <Drawer
        isOpen={signOutDrawerOpen}
        onClose={() => setSignOutDrawerOpen(false)}
        title="Sign out"
      >
        <p
          style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-6)',
          }}
          data-testid="signout-confirmation-text"
        >
          Are you sure you want to sign out?
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setSignOutDrawerOpen(false)}
            data-testid="signout-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            loading={signOutLoading}
            onClick={handleSignOut}
            data-testid="signout-confirm-btn"
          >
            {signOutLoading ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </Drawer>
    </main>
  );
}
