'use client';

import { Recipe, MealType } from '@/types';
import { Drawer } from './ui';
import { cn } from '@/lib/utils';

interface RecipeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType | null;
  currentRecipeId: string | null;
  recipes: Recipe[];
  onSelectRecipe: (recipeId: string) => void;
  onSurpriseMe: () => void;
  mode?: 'swap' | 'add';
}

export default function RecipeDrawer({
  isOpen,
  onClose,
  mealType,
  currentRecipeId,
  recipes,
  onSelectRecipe,
  onSurpriseMe,
  mode = 'swap',
}: RecipeDrawerProps) {
  const mealTypeLabel = mealType ? mealType.charAt(0).toUpperCase() + mealType.slice(1) : '';
  const title = mode === 'add' ? `Add a ${mealTypeLabel}` : `Choose a ${mealTypeLabel}`;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title}>
      {/* Surprise me button */}
      <button
        onClick={() => {
          onSurpriseMe();
          onClose();
        }}
        className="w-full py-3 px-4 bg-primary-light border border-primary rounded-sm text-primary font-semibold text-base min-h-11 mb-4 transition-all cursor-pointer hover:bg-primary hover:text-primary-foreground"
        data-testid="surprise-me-btn"
        aria-label={`Choose a random ${mealTypeLabel.toLowerCase()} recipe`}
      >
        Surprise me
      </button>

      {/* Recipe list */}
      <div className="flex flex-col gap-2" data-testid="recipe-drawer-list">
        {(() => {
          const userRecipes = recipes.filter(r => r.isUserRecipe);
          const builtInRecipes = recipes.filter(r => !r.isUserRecipe);
          const hasUserRecipes = userRecipes.length > 0;
          const hasBuiltInRecipes = builtInRecipes.length > 0;

          const renderRecipe = (recipe: Recipe) => {
            const isCurrent = recipe.id === currentRecipeId;
            const totalTime = recipe.prepTime + recipe.cookTime;

            return (
              <button
                key={recipe.id}
                onClick={() => {
                  if (!isCurrent) {
                    onSelectRecipe(recipe.id);
                    onClose();
                  }
                }}
                disabled={isCurrent}
                className={cn(
                  'w-full py-3 px-4 rounded-sm text-left min-h-11 flex items-center justify-between transition-[border-color] duration-150 cursor-pointer border',
                  isCurrent
                    ? 'border-primary bg-primary-light cursor-default'
                    : 'border-border bg-background hover:border-primary'
                )}
                data-testid={`recipe-option-${recipe.id}`}
                aria-pressed={isCurrent}
              >
                <div className="flex-1">
                  <span className="block text-base font-semibold text-foreground">{recipe.title}</span>
                  <div className="flex gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">{totalTime} mins</span>
                    <span className="text-sm text-muted-foreground capitalize">{recipe.difficulty}</span>
                  </div>
                </div>
                {isCurrent && <span className="text-sm text-primary font-semibold px-2 py-1 bg-background rounded-sm">Current</span>}
              </button>
            );
          };

          return (
            <>
              {hasUserRecipes && (
                <>
                  <div className="py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">My Recipes</div>
                  {userRecipes.map(renderRecipe)}
                </>
              )}
              {hasUserRecipes && hasBuiltInRecipes && (
                <div className="py-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide mt-3">More Recipes</div>
              )}
              {builtInRecipes.map(renderRecipe)}
            </>
          );
        })()}
      </div>
    </Drawer>
  );
}
