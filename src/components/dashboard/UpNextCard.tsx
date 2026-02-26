'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { Meal, MealType, Recipe } from '@/types';
import { Calendar } from 'lucide-react';

export interface TodayMealWithRecipe {
  meal: Meal;
  recipe: Recipe;
}

interface TodayCardProps {
  /** All meal+recipe pairs for today, across all meal types */
  todayMealsWithRecipes: TodayMealWithRecipe[];
  /** The meal type tab to select by default */
  defaultMealType: MealType;
  /** Shopping list status for the status text */
  shoppingStatus: { checked: number; total: number };
}

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner'];

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-base font-semibold text-foreground">{children}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function TodayCard({
  todayMealsWithRecipes,
  defaultMealType,
  shoppingStatus,
}: TodayCardProps) {
  const router = useRouter();
  const [selectedMealType, setSelectedMealType] = useState<MealType>(defaultMealType);

  // Which meal types have meals today
  const presentMealTypes = MEAL_ORDER.filter((mt) =>
    todayMealsWithRecipes.some((m) => m.meal.mealType === mt)
  );

  // Meals for the currently selected tab
  const selectedMeals = todayMealsWithRecipes.filter(
    (m) => m.meal.mealType === selectedMealType
  );

  const primaryRecipe = selectedMeals[0]?.recipe ?? null;

  const recipeUrl = primaryRecipe
    ? primaryRecipe.isUserRecipe
      ? `/recipes/${primaryRecipe.id}`
      : `/recipe/${primaryRecipe.id}`
    : null;

  // Shopping status text
  let shoppingStatusText: string | null = null;
  if (shoppingStatus.total > 0 && shoppingStatus.checked === shoppingStatus.total) {
    shoppingStatusText = 'Everything has been ticked off on the shopping list';
  } else if (shoppingStatus.checked > 0 && shoppingStatus.checked < shoppingStatus.total) {
    shoppingStatusText = `${shoppingStatus.checked} of ${shoppingStatus.total} shopping items ticked off`;
  }

  return (
    <Card data-testid="today-card" className="mb-4">
      <SectionHeading>Today</SectionHeading>

      {/* Meal type tabs */}
      {presentMealTypes.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {presentMealTypes.map((mt) => {
            const isSelected = mt === selectedMealType;
            return (
              <button
                key={mt}
                data-testid={`today-tab-${mt}`}
                onClick={() => setSelectedMealType(mt)}
                className={[
                  'px-4 py-2 rounded-full text-sm font-medium border transition-colors min-h-[44px]',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-foreground border-border',
                ].join(' ')}
              >
                {MEAL_LABELS[mt]}
              </button>
            );
          })}
        </div>
      )}

      {primaryRecipe ? (
        <>
          {/* Recipe name */}
          <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="today-recipe-title">
            {primaryRecipe.title}
          </h2>

          {/* Metadata */}
          <p className="text-sm text-muted-foreground mb-1">
            {primaryRecipe.prepTime + primaryRecipe.cookTime} minutes
            {primaryRecipe.servings ? ` | serves ${primaryRecipe.servings}` : ''}
          </p>

          {/* Description */}
          {primaryRecipe.description && (
            <p className="text-sm text-muted-foreground mb-1">
              {primaryRecipe.description}
            </p>
          )}

          {/* Shopping status */}
          {shoppingStatusText && (
            <p className="text-sm text-muted-foreground mb-4">
              {shoppingStatusText}
            </p>
          )}

          {/* CTAs */}
          <div className="space-y-2 mt-4">
            {recipeUrl && (
              <Button
                variant="primary"
                className="w-full"
                data-testid="today-view-recipe-btn"
                onClick={() => router.push(recipeUrl)}
              >
                <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
                View recipe
              </Button>
            )}
            <Button
              variant="secondary"
              className="w-full"
              data-testid="today-view-plan-btn"
              onClick={() => router.push('/plan/current')}
            >
              <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
              View full plan
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          No {MEAL_LABELS[selectedMealType].toLowerCase()} planned for today.
        </p>
      )}
    </Card>
  );
}

// Keep the old export name as an alias for any tests still referencing it
export { TodayCard };
