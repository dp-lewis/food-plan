'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { getRecipeById, getRecipesByMealType } from '@/data/recipes';
import { generateShoppingList, mergeShoppingLists } from '@/lib/shoppingList';
import { getTodayPlanIndex, getUpNextSlot } from '@/lib/dates';
import { MealType, Meal } from '@/types';
import RecipeDrawer from '@/components/RecipeDrawer';
import SignOutDialog from '@/components/SignOutDialog';
import { BottomNav, PageHeader } from '@/components/ui';
import { buttonVariants } from '@/components/ui/Button';
import { useAuth } from '@/components/AuthProvider';
import { Utensils } from 'lucide-react';
import TodayCard from '@/components/dashboard/UpNextCard';
import ShoppingStatusCard from '@/components/dashboard/ShoppingStatusCard';

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

    // Up next slot — used to determine the default tab
    const upNextSlot = getUpNextSlot(todayIndex, currentPlan.meals, hour);

    // All meals for today, sorted by meal order
    const todayMealsWithRecipes = currentPlan.meals
      .filter((m) => m.dayIndex === todayIndex)
      .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType))
      .map((meal) => ({ meal, recipe: getRecipeById(meal.recipeId, userRecipes) }))
      .filter(
        (item): item is { meal: Meal; recipe: NonNullable<ReturnType<typeof getRecipeById>> } =>
          item.recipe !== undefined
      );

    const hasTodayMeals = todayMealsWithRecipes.length > 0;

    // Default tab: prefer the up-next slot's meal type, else first present meal type
    const defaultMealType: MealType =
      upNextSlot && upNextSlot.label !== 'Tomorrow'
        ? upNextSlot.mealType
        : todayMealsWithRecipes[0]?.meal.mealType ?? 'dinner';

    return (
      <div className="min-h-screen bg-primary" data-testid="dashboard">
        {pageHeader}
        <main id="main-content" className="bg-background rounded-t-3xl max-w-2xl mx-auto px-4 py-8 pb-40 space-y-8">

          {hasTodayMeals && (
            <TodayCard
              todayMealsWithRecipes={todayMealsWithRecipes}
              defaultMealType={defaultMealType}
              shoppingStatus={shoppingStatus ?? { checked: 0, total: 0 }}
            />
          )}

          {shoppingStatus && shoppingStatus.total > 0 && (
            <ShoppingStatusCard shoppingStatus={shoppingStatus} />
          )}

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

        <BottomNav hideFab />
      </div>
    );
  }

  // ─── Empty state: no plan yet ───
  return (
    <div className="min-h-screen bg-primary" data-testid="empty-state">
      {pageHeader}
      <main id="main-content" className="bg-background rounded-t-3xl max-w-2xl mx-auto px-4 py-8 pb-40 space-y-8">
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
      <BottomNav hideFab />
    </div>
  );
}
