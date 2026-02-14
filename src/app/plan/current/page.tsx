'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { getRecipeById, getRecipesByMealType } from '@/data/recipes';
import { MealType } from '@/types';
import RecipeDrawer from '@/components/RecipeDrawer';
import { BottomNav, Button, Card, PageHeader } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { generateShareLink } from '@/app/actions/share';
import { Share2 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

/**
 * Get ordered day names starting from the plan's startDay.
 * startDay: 0=Monday, 1=Tuesday, ... 6=Sunday
 */
function getOrderedDays(startDay: number): string[] {
  return Array.from({ length: 7 }, (_, i) => DAYS[(startDay + i) % 7]);
}

/**
 * Get today's dayIndex within the plan based on the plan's startDay.
 * startDay uses 0=Monday ... 6=Sunday.
 * Returns 0-6, where 0 is the plan's first day.
 */
function getTodayPlanIndex(startDay: number): number {
  const now = new Date();
  const jsDay = now.getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
  return (todayIndex - startDay + 7) % 7;
}

/**
 * Get the formatted date string (e.g. "Feb 15") for a given dayIndex in the plan.
 */
function getDateForDayIndex(startDay: number, dayIndex: number): string {
  const now = new Date();
  const jsDay = now.getDay();
  const todayWeekday = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon...6=Sun
  const todayPlanIndex = (todayWeekday - startDay + 7) % 7;
  const diff = dayIndex - todayPlanIndex;
  const date = new Date(now);
  date.setDate(date.getDate() + diff);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const { user } = useAuth();
  const [shareStatus, setShareStatus] = useState<'idle' | 'loading' | 'copied'>('idle');

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

  const handleShare = async () => {
    if (!currentPlan || shareStatus === 'loading') return;
    setShareStatus('loading');
    try {
      const result = await generateShareLink(currentPlan.id);
      if (result.error) {
        setShareStatus('idle');
        return;
      }
      const url = result.data!;
      // Try Web Share API first (mobile), fallback to clipboard
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Meal Plan', url });
        } catch {
          // User cancelled share - that's fine
        }
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch {
      setShareStatus('idle');
    }
  };

  // Hooks must be called unconditionally before any early returns.
  const orderedDays = useMemo(
    () => getOrderedDays(currentPlan?.preferences.startDay ?? 0),
    [currentPlan?.preferences.startDay]
  );

  // Build 7 days × 3 meal slots — memoized so DOM nodes are stable across
  // re-renders that don't change plan data (e.g. opening/closing the drawer).
  const slotsByDay = useMemo(
    () =>
      orderedDays.map((dayName, dayIndex) => {
        const slots = MEAL_TYPES.map(mealType => ({
          mealType,
          meals: (currentPlan?.meals ?? []).filter(
            m => m.dayIndex === dayIndex && m.mealType === mealType
          ),
        }));
        return { dayName, dayIndex, slots };
      }),
    [currentPlan?.meals, orderedDays]
  );

  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage before acting on state.
    const unsub = useStore.persist.onHydrate(() => {/* no-op */});
    const unsubFinish = useStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    // If hydration already completed before this effect runs, check directly.
    if (useStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return () => {
      unsub();
      unsubFinish();
    };
  }, []);

  useEffect(() => {
    if (hasHydrated && !currentPlan) {
      router.push('/');
    }
  }, [hasHydrated, currentPlan, router]);

  const todayIndex = useMemo(
    () => currentPlan ? getTodayPlanIndex(currentPlan.preferences.startDay) : 0,
    [currentPlan]
  );

  if (!hasHydrated || !currentPlan) {
    return null;
  }

  const drawerRecipes = drawerState.mealType
    ? getRecipesByMealType(drawerState.mealType, userRecipes)
        .filter(r => !drawerState.excludeRecipeIds.includes(r.id))
    : [];

  return (
    <div className="min-h-screen bg-background" data-testid="meal-plan">
      <PageHeader
        title="Meal Plan"
        backHref="/"
        sticky
        actions={
          user ? (
            <button
              type="button"
              onClick={handleShare}
              data-testid="share-plan-btn"
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
              aria-label={shareStatus === 'copied' ? 'Link copied' : 'Share plan'}
            >
              <Share2 className="w-5 h-5" />
            </button>
          ) : undefined
        }
      />
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        <div className="flex items-center justify-end">
          <Link
            href="/plan"
            className="text-sm text-primary"
          >
            Change start day
          </Link>
        </div>

        <div className="space-y-4">
          {slotsByDay.map(({ dayName, dayIndex, slots }) => {
            const isToday = dayIndex === todayIndex;
            return (
            <Card
              key={dayName}
              padding="none"
              data-testid={`day-${dayIndex}`}
              className={`scroll-mt-20 ${isToday ? 'border-2 border-primary' : ''}`}
            >
              <div className="px-4 py-2 bg-muted font-semibold text-base text-foreground">
                <div className="flex items-center gap-2">
                  {dayName}
                  {isToday && (
                    <span className="text-xs font-medium bg-primary-foreground text-primary px-2 py-0.5 rounded">Today</span>
                  )}
                </div>
                <div className="text-xs font-normal text-muted-foreground">
                  {getDateForDayIndex(currentPlan.preferences.startDay, dayIndex)}
                </div>
              </div>
              <div className="divide-y divide-border">
                {slots.map(({ mealType, meals }) => {
                  const slotRecipeIds = meals.map(m => m.recipeId);

                  return (
                    <div key={mealType} data-testid={`slot-${dayIndex}-${mealType}`}>
                      {/* Meal type header */}
                      <div className="px-4 pt-3 pb-1 text-sm text-muted-foreground">
                        <span className="uppercase tracking-wide">{mealType}</span>
                      </div>

                      {/* Meals in this slot */}
                      {meals.length === 0 ? (
                        <div className="px-4 pb-3 space-y-2">
                          <div className="p-3 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
                            No meals planned
                          </div>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => openAddDrawer(dayIndex, mealType, slotRecipeIds)}
                            data-testid={`add-meal-${dayIndex}-${mealType}`}
                            aria-label={`Add ${mealType}`}
                            className="w-full"
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
                                  <p className="text-base text-foreground font-semibold">
                                    {recipe.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
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
                              className="text-primary"
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
            );
          })}
        </div>

      </main>

      <BottomNav onShareClick={() => console.log('sharing')} />

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
    </div>
  );
}
