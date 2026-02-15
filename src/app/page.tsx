'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { getRecipeById, getRecipesByMealType } from '@/data/recipes';
import { generateShoppingList, mergeShoppingLists } from '@/lib/shoppingList';
import { MealType, Meal } from '@/types';
import RecipeDrawer from '@/components/RecipeDrawer';
import { Card, Button, BottomNav, ProgressBar, PageHeader } from '@/components/ui';
import Drawer from '@/components/ui/Drawer';
import { useAuth } from '@/components/AuthProvider';
import { ChefHat, ShoppingCart, Calendar, Utensils, User } from 'lucide-react';

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
    await fetch('/auth/signout', { method: 'POST' });
    router.push('/');
    router.refresh();
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
    let primaryAction: { href: string; label: string; subtitle: string; icon: typeof ShoppingCart };
    if (!shoppingStarted && shoppingStatus && shoppingStatus.total > 0) {
      const remaining = shoppingStatus.total - shoppingStatus.checked;
      primaryAction = { href: '/shopping-list', label: 'Go Shopping', subtitle: `${remaining} items remaining`, icon: ShoppingCart };
    } else if (hasUpNext && upNextMealsWithRecipes.length === 1) {
      const firstRecipe = upNextMealsWithRecipes[0].recipe;
      const recipeUrl = firstRecipe.isUserRecipe ? `/recipes/${firstRecipe.id}` : `/recipe/${firstRecipe.id}`;
      primaryAction = { href: recipeUrl, label: 'View Recipe', subtitle: `${firstRecipe.prepTime + firstRecipe.cookTime} mins total`, icon: ChefHat };
    } else if (hasUpNext) {
      primaryAction = { href: '/plan/current', label: 'View Recipes', subtitle: `${upNextMealsWithRecipes.length} meals`, icon: ChefHat };
    } else {
      primaryAction = { href: '/plan/current', label: 'View Full Plan', subtitle: `Day ${todayIndex + 1} of 7`, icon: Calendar };
    }

    const tomorrowDayName = getDayName(currentPlan.preferences.startDay, tomorrowIndex);

    return (
      <div className="min-h-screen bg-background" data-testid="dashboard">
        <PageHeader
          title={
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              <span>Did We Get</span>
            </div>
          }
          actions={
            <div className="flex items-center gap-3">
              {!authLoading && (
                user ? (
                  <button
                    type="button"
                    data-testid="user-menu-btn"
                    onClick={() => setSignOutDrawerOpen(true)}
                    disabled={signOutLoading}
                    className="text-xs text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    {signOutLoading ? 'Signing out…' : user.email}
                  </button>
                ) : (
                  <Link
                    href="/auth/signin"
                    data-testid="sign-in-link"
                    className="flex items-center gap-1 text-xs text-primary-foreground/70 hover:text-primary-foreground"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign in</span>
                  </Link>
                )
              )}
            </div>
          }
          sticky
        />
        <main id="main-content" className="max-w-2xl mx-auto px-4 py-6 pb-40 space-y-6">

          {/* ── Section 1: Up Next ── */}
          {hasUpNext && upNextSlot && (
            <Card data-testid="up-next-card" className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="uppercase tracking-wide text-sm text-muted-foreground">
                  {upNextSlot.label}
                </span>
                <span className="uppercase tracking-wide text-sm text-muted-foreground">
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
                        <p className={`mb-1 font-semibold text-foreground ${isFirst ? 'text-2xl' : 'text-base'}`}>
                          {recipe.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
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
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Tomorrow &middot; {tomorrowDayName}
              </h2>
              <div className="space-y-1">
                {tomorrowMeals.map((meal) => {
                  const recipe = getRecipeById(meal.recipeId, userRecipes);
                  if (!recipe) return null;
                  return (
                    <div
                      key={meal.id}
                      className="flex items-baseline gap-2 text-base"
                    >
                      <span className="uppercase text-sm text-muted-foreground min-w-[4.5rem]">
                        {meal.mealType}
                      </span>
                      <span className="text-foreground">
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
                  <p className="text-base text-muted-foreground">
                    Shopping complete
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-semibold text-foreground">
                        Shopping list
                      </span>
                      <span className="text-sm text-muted-foreground">
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
          <div className="grid grid-cols-1 gap-3">
            <Link href={primaryAction.href} data-testid="primary-action-link">
              <Button className="w-full h-auto py-4 justify-start text-left">
                <primaryAction.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-semibold">{primaryAction.label}</div>
                  <div className="text-sm font-normal opacity-70">{primaryAction.subtitle}</div>
                </div>
              </Button>
            </Link>
            <Link href="/plan/current" data-testid="view-full-plan-link">
              <Button variant="secondary" className="w-full h-auto py-4 justify-start text-left">
                <Calendar className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <div className="font-semibold">Full Plan</div>
                  <div className="text-sm font-normal opacity-70">Day {todayIndex + 1} of 7</div>
                </div>
              </Button>
            </Link>
          </div>

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
            className="text-base text-muted-foreground mb-6"
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
        <BottomNav />
      </div>
    );
  }

  // ─── Empty state: no plan yet ───
  return (
    <div className="min-h-screen bg-background" data-testid="empty-state">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            <span>Did We Get</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-3">
            {!authLoading && (
              user ? (
                <button
                  type="button"
                  data-testid="user-menu-btn"
                  onClick={() => setSignOutDrawerOpen(true)}
                  disabled={signOutLoading}
                  className="text-xs text-primary-foreground/70 hover:text-primary-foreground"
                >
                  {signOutLoading ? 'Signing out…' : user.email}
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  data-testid="sign-in-link"
                  className="text-xs text-primary-foreground/70 hover:text-primary-foreground"
                >
                  Sign in
                </Link>
              )
            )}
          </div>
        }
        sticky
      />
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6 pb-40 space-y-6">
        <div className="text-center py-12">
          <h2 className="mb-2 text-2xl font-semibold text-foreground">
            What&apos;s for dinner this week?
          </h2>
          <p className="mb-8 text-base text-muted-foreground">
            Create a plan and we&apos;ll sort out your shopping list.
          </p>
          <Link href="/plan" data-testid="create-first-plan-btn">
            <Button className="w-full">Create Your Plan</Button>
          </Link>
        </div>
      </main>

      <BottomNav />

      {/* Sign out confirmation drawer */}
      <Drawer
        isOpen={signOutDrawerOpen}
        onClose={() => setSignOutDrawerOpen(false)}
        title="Sign out"
      >
        <p
          className="text-base text-muted-foreground mb-6"
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
    </div>
  );
}
