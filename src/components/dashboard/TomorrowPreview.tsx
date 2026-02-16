'use client';

import { Card } from '@/components/ui';
import { Meal, Recipe } from '@/types';

export interface TomorrowMealWithRecipe {
  meal: Meal;
  recipe: Recipe;
}

interface TomorrowPreviewProps {
  dayName: string;
  mealsWithRecipes: TomorrowMealWithRecipe[];
}

export default function TomorrowPreview({ dayName, mealsWithRecipes }: TomorrowPreviewProps) {
  if (mealsWithRecipes.length === 0) return null;

  return (
    <Card data-testid="tomorrow-preview" className="mb-4">
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Tomorrow &middot; {dayName}
      </h2>
      <div className="space-y-1">
        {mealsWithRecipes.map(({ meal, recipe }) => (
          <div key={meal.id} className="flex items-baseline gap-2 text-base">
            <span className="uppercase text-sm text-muted-foreground min-w-[4.5rem]">
              {meal.mealType}
            </span>
            <span className="text-foreground">
              {recipe.title}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
