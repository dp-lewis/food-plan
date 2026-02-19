'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { SharedPlanData, MealType } from '@/types';
import { getRecipeById } from '@/data/recipes';
import { generateShoppingList, groupByCategory, mergeShoppingLists, CATEGORY_LABELS } from '@/lib/shoppingList';
import { Card, PageHeader, Button } from '@/components/ui';
import { buttonVariants } from '@/components/ui/Button';
import { useAuth } from '@/components/AuthProvider';
import { useStore } from '@/store/store';
import { joinSharedPlan } from '@/app/actions/share';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

function getOrderedDays(startDay: number): string[] {
  return Array.from({ length: 7 }, (_, i) => DAYS[(startDay + i) % 7]);
}

export default function SharedPlanView({ data, shareCode }: { data: SharedPlanData; shareCode: string }) {
  const { plan, recipes: userRecipes, customItems } = data;
  const { user } = useAuth();
  const router = useRouter();
  const currentPlan = useStore((state) => state.currentPlan);
  const [joinStatus, setJoinStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Check if the user is already on this plan (owner or member)
  const isAlreadyOnPlan = currentPlan?.id === plan.id;

  const handleJoin = async () => {
    if (joinStatus === 'loading') return;
    setJoinStatus('loading');
    setJoinError(null);

    // Wait for any ongoing initial sync to complete, so our store
    // update isn't overwritten by a concurrent loadActivePlan response.
    while (useStore.getState()._isSyncing) {
      await new Promise(r => setTimeout(r, 50));
    }

    const result = await joinSharedPlan(shareCode);
    if (result.error) {
      setJoinStatus('error');
      setJoinError(result.error);
      return;
    }

    const { plan: joinedPlan, recipes, customItems: items } = result.data!;
    useStore.setState({
      currentPlan: joinedPlan,
      userRecipes: recipes,
      customShoppingItems: items,
      checkedItems: {},
      _planRole: 'member',
    });

    router.push('/plan/current');
  };

  const orderedDays = useMemo(
    () => getOrderedDays(plan.preferences.startDay),
    [plan.preferences.startDay]
  );

  const slotsByDay = useMemo(
    () =>
      orderedDays.map((dayName, dayIndex) => {
        const slots = MEAL_TYPES.map(mealType => ({
          mealType,
          meals: plan.meals.filter(
            m => m.dayIndex === dayIndex && m.mealType === mealType
          ),
        }));
        return { dayName, dayIndex, slots };
      }),
    [plan.meals, orderedDays]
  );

  const shoppingList = useMemo(() => {
    const generatedItems = generateShoppingList(plan, userRecipes);
    return mergeShoppingLists(generatedItems, customItems);
  }, [plan, userRecipes, customItems]);

  const groupedItems = useMemo(() => groupByCategory(shoppingList), [shoppingList]);

  return (
    <div className="min-h-screen bg-background" data-testid="shared-plan">
      <PageHeader title="Shared Meal Plan" backHref="/" sticky />
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6 pb-6 space-y-6">
        {/* Join CTA for unauthenticated users */}
        {!user && (
          <Card data-testid="join-plan-cta">
            <div className="text-center space-y-3">
              <p className="text-base text-foreground font-semibold">
                Sign in to collaborate on this plan
              </p>
              <p className="text-sm text-muted-foreground">
                Create a free account or sign in to join this meal plan.
              </p>
              <Link
                href={`/auth/signin?next=/shared/${shareCode}`}
                data-testid="join-plan-signin-btn"
                className={buttonVariants({ variant: 'primary' }) + ' w-full'}
              >
                Join this plan
              </Link>
            </div>
          </Card>
        )}

        {/* Join banner for authenticated users */}
        {user && (
          <Card>
            {isAlreadyOnPlan ? (
              <div className="text-center space-y-2">
                <p className="text-base text-foreground font-semibold">
                  You&apos;re already on this plan
                </p>
                <Link
                  href="/plan/current"
                  className="text-primary text-sm font-medium"
                  data-testid="go-to-plan-link"
                >
                  Go to your plan
                </Link>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-base text-foreground font-semibold">
                  Want to use this meal plan?
                </p>
                <p className="text-sm text-muted-foreground">
                  Join this plan to see it on your dashboard and shopping list.
                </p>
                <Button
                  variant="primary"
                  onClick={handleJoin}
                  disabled={joinStatus === 'loading'}
                  data-testid="join-plan-btn"
                  className="w-full"
                >
                  {joinStatus === 'loading' ? 'Joining...' : 'Use This Plan'}
                </Button>
                {joinError && (
                  <p className="text-sm text-destructive">{joinError}</p>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Meal Calendar - read only */}
        <div className="space-y-4">
          {slotsByDay.map(({ dayName, dayIndex, slots }) => (
            <Card key={dayName} padding="none" data-testid={`day-${dayIndex}`}>
              <div className="px-4 py-2 bg-muted font-semibold text-base text-foreground">
                {dayName}
              </div>
              <div className="divide-y divide-border">
                {slots.map(({ mealType, meals }) => (
                  <div key={mealType} data-testid={`slot-${dayIndex}-${mealType}`}>
                    <div className="px-4 pt-3 pb-1 text-sm text-muted-foreground">
                      <span className="uppercase tracking-wide">{mealType}</span>
                    </div>

                    {meals.length === 0 ? (
                      <div className="px-4 pb-3 text-muted-foreground">
                        <span className="text-base italic">
                          No meals planned
                        </span>
                      </div>
                    ) : (
                      meals.map((meal) => {
                        const recipe = getRecipeById(meal.recipeId, userRecipes);
                        if (!recipe) return null;
                        return (
                          <div
                            key={meal.id}
                            className="px-4 py-2"
                            data-testid={`meal-${meal.id}`}
                          >
                            <p className="text-base text-foreground font-semibold">
                              {recipe.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {recipe.prepTime + recipe.cookTime} mins
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Shopping List - read only */}
        {shoppingList.length > 0 && (
          <div className="mt-8" data-testid="shared-shopping-list">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              Shopping List
            </h2>
            <div className="space-y-6">
              {Array.from(groupedItems.entries()).map(([category, items]) => (
                <section key={category} data-testid={`category-${category}`}>
                  <h3 className="mb-3 pb-2 text-base font-semibold text-foreground border-b border-border">
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        data-testid={`item-${item.id}`}
                        className="px-1 py-1 text-base text-foreground"
                      >
                        <span className="text-muted-foreground">
                          {item.quantity} {item.unit}
                        </span>{' '}
                        {item.ingredient}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
