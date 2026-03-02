'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { Meal, Recipe } from '@/types';

interface MealCardProps {
  meal: Meal;
  recipe: Recipe;
  onRemove?: (mealId: string) => void;
}

export default function MealCard({ meal, recipe, onRemove }: MealCardProps) {
  const recipeUrl = recipe.isUserRecipe
    ? `/recipes/${recipe.id}`
    : `/recipe/${recipe.id}`;

  return (
    <div
      className="flex items-center justify-between px-4 py-2"
      data-testid={`meal-${meal.id}`}
    >
      <Link href={recipeUrl} className="flex-1 flex items-center gap-2 transition-colors">
        <div className="flex-1">
          <p className="text-base text-foreground font-normal font-display">
            {recipe.title}
          </p>
          <p className="text-sm text-muted-foreground">
            {recipe.prepTime + recipe.cookTime} mins
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </Link>
      {onRemove && (
        <Button
          variant="ghost"
          size="small"
          onClick={() => onRemove(meal.id)}
          data-testid={`remove-meal-${meal.id}`}
          aria-label={`Remove ${recipe.title}`}
        >
          Remove
        </Button>
      )}
    </div>
  );
}
