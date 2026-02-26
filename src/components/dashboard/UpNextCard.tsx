'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { Meal, MealType, Recipe } from '@/types';
import { BookOpen, Calendar } from 'lucide-react';

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
    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <span className="bg-card px-4 text-xl font-normal text-foreground whitespace-nowrap font-display">
        {children}
      </span>
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
    <Card data-testid="today-card" className="relative pt-8">
      <SectionHeading>Today</SectionHeading>

      {/* Meal type tabs */}
      {presentMealTypes.length > 0 && (
        <div className="flex gap-2 mb-4">
          {presentMealTypes.map((mt) => {
            const isSelected = mt === selectedMealType;
            return (
              <button
                key={mt}
                data-testid={`today-tab-${mt}`}
                onClick={() => setSelectedMealType(mt)}
                className={[
                  'flex-1 py-2 rounded-full text-sm font-medium border transition-colors min-h-[44px] text-center',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-primary border-primary',
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
          <h2 className="text-[2rem] font-normal text-foreground mb-2" data-testid="today-recipe-title">
            {primaryRecipe.title}
          </h2>

          {/* Metadata */}
          <p className="text-sm text-muted-foreground mb-2">
            {primaryRecipe.prepTime + primaryRecipe.cookTime} minutes
            {primaryRecipe.servings ? ` | serves ${primaryRecipe.servings}` : ''}
          </p>

          {/* Description */}
          {primaryRecipe.description && (
            <p className="text-sm text-muted-foreground mb-2">
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
          <div className="flex flex-col gap-2 mt-4">
            {recipeUrl && (
              <Button
                variant="primary"
                className="w-full justify-start h-auto py-4 px-4 rounded-[16px]"
                data-testid="today-view-recipe-btn"
                onClick={() => router.push(recipeUrl)}
              >
                <BookOpen className="w-4 h-4 mr-2" aria-hidden="true" />
                View recipe
              </Button>
            )}
            <Button
              variant="secondary"
              className="w-full justify-start bg-background h-auto py-4 px-4 rounded-[16px]"
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
