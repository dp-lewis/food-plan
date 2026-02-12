'use client';

import { useMemo } from 'react';
import type { SharedPlanData, MealType } from '@/types';
import { getRecipeById } from '@/data/recipes';
import { generateShoppingList, groupByCategory, mergeShoppingLists, CATEGORY_LABELS } from '@/lib/shoppingList';
import { BottomNav, Card } from '@/components/ui';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

function getOrderedDays(startDay: number): string[] {
  return Array.from({ length: 7 }, (_, i) => DAYS[(startDay + i) % 7]);
}

export default function SharedPlanView({ data }: { data: SharedPlanData }) {
  const { plan, recipes: userRecipes, customItems } = data;

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
    <main id="main-content" className="min-h-screen p-4 pb-24" data-testid="shared-plan">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <h1
          className="mb-6"
          style={{
            fontSize: 'var(--font-size-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
          }}
        >
          Shared Meal Plan
        </h1>

        {/* Meal Calendar - read only */}
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
                {slots.map(({ mealType, meals }) => (
                  <div key={mealType} data-testid={`slot-${dayIndex}-${mealType}`}>
                    <div
                      className="px-4 pt-3 pb-1"
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      <span className="uppercase tracking-wide">{mealType}</span>
                    </div>

                    {meals.length === 0 ? (
                      <div
                        className="px-4 pb-3"
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
            <h2
              className="mb-4"
              style={{
                fontSize: 'var(--font-size-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Shopping List
            </h2>
            <div className="space-y-6">
              {Array.from(groupedItems.entries()).map(([category, items]) => (
                <section key={category} data-testid={`category-${category}`}>
                  <h3
                    className="mb-3 pb-2"
                    style={{
                      fontSize: 'var(--font-size-body)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--color-text-primary)',
                      borderBottom: 'var(--border-width) solid var(--color-border)',
                    }}
                  >
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        data-testid={`item-${item.id}`}
                        className="px-1 py-1"
                        style={{
                          fontSize: 'var(--font-size-body)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        <span style={{ color: 'var(--color-text-muted)' }}>
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
      </div>

      <BottomNav backHref="/" maxWidth="2xl" />
    </main>
  );
}
