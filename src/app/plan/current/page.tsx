'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { getRecipesByMealType } from '@/data/recipes';
import { getTodayPlanIndex, getOrderedDays } from '@/lib/dates';
import { MealType } from '@/types';
import RecipeDrawer from '@/components/RecipeDrawer';
import SignOutDialog from '@/components/SignOutDialog';
import { BottomNav, Card, PageHeader, Toast } from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { generateShareLink } from '@/app/actions/share';
import DaySlot from '@/components/plan/DaySlot';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

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
  const planRole = useStore((state) => state._planRole);
  const swapMeal = useStore((state) => state.swapMeal);
  const addMeal = useStore((state) => state.addMeal);
  const removeMeal = useStore((state) => state.removeMeal);
  const userRecipes = useStore((state) => state.userRecipes);

  const { user, loading: authLoading } = useAuth();
  const [shareStatus, setShareStatus] = useState<'idle' | 'loading' | 'copied'>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');

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
        setToastVariant('error');
        setToastMessage(result.error ?? 'Failed to generate share link');
        return;
      }
      const url = result.data!;
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Meal Plan', url });
        } catch {
          // User cancelled share - that's fine
        }
      } else {
        await navigator.clipboard.writeText(url);
        setToastVariant('success');
        setToastMessage('Link copied to clipboard');
      }
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch (err) {
      setShareStatus('idle');
      setToastVariant('error');
      setToastMessage(err instanceof Error ? err.message : 'Failed to generate share link');
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
    const unsub = useStore.persist.onHydrate(() => {/* no-op */});
    const unsubFinish = useStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
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
    return (
      <div className="min-h-screen bg-background" data-testid="meal-plan">
        <PageHeader title="Meal Plan" backHref="/" sticky />
        <main className="max-w-2xl mx-auto px-4 py-6 pb-40 space-y-6">
          <div className="flex items-center justify-end">
            <div className="h-4 w-28 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Card key={i} padding="none">
                <div className="px-4 py-2 bg-muted">
                  <div className="h-5 w-24 bg-muted-foreground/10 animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted-foreground/10 animate-pulse rounded mt-1" />
                </div>
                <div className="divide-y divide-border">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="px-4 py-4">
                      <div className="h-3 w-16 bg-muted animate-pulse rounded mb-2" />
                      <div className="h-5 w-48 bg-muted animate-pulse rounded mb-1" />
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </main>
        <BottomNav />
      </div>
    );
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
          !authLoading && (
            <SignOutDialog userEmail={user?.email} />
          )
        }
      />
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6 pb-40 space-y-6">
        {planRole === 'member' ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full" data-testid="shared-plan-badge">
              Shared with you
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <Link href="/plan" className="text-sm text-primary">
              Reset plan
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {slotsByDay.map(({ dayName, dayIndex, slots }) => (
            <DaySlot
              key={dayName}
              dayName={dayName}
              dayIndex={dayIndex}
              isToday={dayIndex === todayIndex}
              startDay={currentPlan.preferences.startDay}
              slots={slots}
              userRecipes={userRecipes}
              onAddMeal={openAddDrawer}
              onRemoveMeal={removeMeal}
            />
          ))}
        </div>
      </main>

      <BottomNav onShareClick={planRole === 'owner' && user ? handleShare : undefined} />

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

      <Toast
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastMessage(null)}
      />
    </div>
  );
}
