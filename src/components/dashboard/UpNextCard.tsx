'use client';

import Link from 'next/link';
import { Card } from '@/components/ui';
import { Meal, MealType } from '@/types';
import { Recipe } from '@/types';

export interface UpNextMealWithRecipe {
  meal: Meal;
  recipe: Recipe;
}

interface UpNextCardProps {
  label: string;
  mealType: MealType;
  mealsWithRecipes: UpNextMealWithRecipe[];
}

export default function UpNextCard({ label, mealType, mealsWithRecipes }: UpNextCardProps) {
  return (
    <Card data-testid="up-next-card" className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="uppercase tracking-wide text-sm text-muted-foreground">
          {label}
        </span>
        <span className="uppercase tracking-wide text-sm text-muted-foreground">
          {mealType}
        </span>
      </div>
      <div className="space-y-3">
        {mealsWithRecipes.map(({ meal, recipe }, index) => {
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
  );
}
