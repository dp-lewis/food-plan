'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { getRecipeById, getRecipesByMealType } from '@/data/recipes';
import { generateShoppingList, mergeShoppingLists } from '@/lib/shoppingList';
import { getTodayPlanIndex, getDayName, getUpNextSlot } from '@/lib/dates';
import { MealType, Meal } from '@/types';
import RecipeDrawer from '@/components/RecipeDrawer';
import SignOutDialog from '@/components/SignOutDialog';
import { BottomNav, PageHeader } from '@/components/ui';
import { buttonVariants } from '@/components/ui/Button';
import { useAuth } from '@/components/AuthProvider';
import { ShoppingCart, Calendar, Utensils } from 'lucide-react';
import UpNextCard from '@/components/dashboard/UpNextCard';
import TomorrowPreview from '@/components/dashboard/TomorrowPreview';
import ShoppingStatusCard from '@/components/dashboard/ShoppingStatusCard';
import QuickActions, { PrimaryAction } from '@/components/dashboard/QuickActions';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner'];

interface DrawerState {
  isOpen: boolean;
  mealId: string | null;
  mealType: MealType | null;
  currentRecipeId: string | null;
}

export default function Dashboard() {
  const currentPlan = useStore((state) => state.currentPlan);
  const planRole = useStore((state) => state._planRole);
  const userRecipes = useStore((state) => state.userRecipes);
  const checkedItems = useStore((state) => state.checkedItems);
  const customShoppingItems = useStore((state) => state.customShoppingItems);
  const swapMeal = useStore((state) => state.swapMeal);
  const { user, loading: authLoading } = useAuth();

  const isReadOnly = planRole === 'member';

  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    mealId: null,
    mealType: null,
    currentRecipeId: null,
  });

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
    const checked = allItems.filter((item) => item.id in checkedItems).length;
    return { total, checked };
  }, [currentPlan, userRecipes, customShoppingItems, checkedItems]);

  const pageHeader = (
    <PageHeader
      title={
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5" />
          <span>Did We Get</span>
        </div>
      }
      actions={
        !authLoading && (
          <SignOutDialog userEmail={user?.email} />
        )
      }
      sticky
    />
  );

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
    const tomorrowMealsWithRecipes = showTomorrow
      ? currentPlan.meals
          .filter((m) => m.dayIndex === tomorrowIndex)
          .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType))
          .map(meal => ({ meal, recipe: getRecipeById(meal.recipeId, userRecipes) }))
          .filter((item): item is { meal: Meal; recipe: NonNullable<ReturnType<typeof getRecipeById>> } => item.recipe !== undefined)
      : [];

    const tomorrowDayName = getDayName(currentPlan.preferences.startDay, tomorrowIndex);

    // Shopping status flags
    const shoppingStarted = shoppingStatus && shoppingStatus.checked > 0;

    // Context-aware primary action
    let primaryAction: PrimaryAction;
    if (!shoppingStarted && shoppingStatus && shoppingStatus.total > 0) {
      const remaining = shoppingStatus.total - shoppingStatus.checked;
      primaryAction = { href: '/shopping-list', label: 'Go Shopping', subtitle: `${remaining} items remaining`, icon: ShoppingCart };
    } else {
      primaryAction = { href: '/plan/current', label: 'View Full Plan', subtitle: `Day ${todayIndex + 1} of 7`, icon: Calendar };
    }

    return (
      <div className="min-h-screen bg-background" data-testid="dashboard">
        {pageHeader}
        <main id="main-content" className="max-w-2xl mx-auto px-4 py-6 pb-40 space-y-6">

          {hasUpNext && upNextSlot && (
            <UpNextCard
              label={upNextSlot.label}
              mealType={upNextSlot.mealType}
              mealsWithRecipes={upNextMealsWithRecipes}
            />
          )}

          {showTomorrow && tomorrowMealsWithRecipes.length > 0 && (
            <TomorrowPreview
              dayName={tomorrowDayName}
              mealsWithRecipes={tomorrowMealsWithRecipes}
            />
          )}

          {shoppingStatus && shoppingStatus.total > 0 && (
            <ShoppingStatusCard shoppingStatus={shoppingStatus} />
          )}

          <QuickActions primaryAction={primaryAction} todayIndex={todayIndex} />

        </main>

        <RecipeDrawer
          isOpen={drawerState.isOpen}
          onClose={closeDrawer}
          mealType={drawerState.mealType}
          currentRecipeId={drawerState.currentRecipeId}
          recipes={drawerRecipes}
          onSelectRecipe={handleSelectRecipe}
          onSurpriseMe={handleSurpriseMe}
        />

        <BottomNav hideFab={isReadOnly} />
      </div>
    );
  }

  // ─── Empty state: no plan yet ───
  return (
    <div className="min-h-screen bg-background" data-testid="empty-state">
      {pageHeader}
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6 pb-40 space-y-6">
        <div className="text-center py-12">
          <h2 className="mb-2 text-2xl font-semibold text-foreground">
            What&apos;s for dinner this week?
          </h2>
          <p className="mb-8 text-base text-muted-foreground">
            Plan your week, share with your household, and check off the shopping together.
          </p>
          <Link
            href="/plan"
            data-testid="create-first-plan-btn"
            className={buttonVariants({ variant: 'primary' }) + ' w-full'}
          >
            Create Your Plan
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
