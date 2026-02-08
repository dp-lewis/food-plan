'use client';

import { Recipe, MealType } from '@/types';
import { Drawer } from './ui';

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
        className="surprise-me-btn"
        data-testid="surprise-me-btn"
        aria-label={`Choose a random ${mealTypeLabel.toLowerCase()} recipe`}
      >
        Surprise me
      </button>

      {/* Recipe list */}
      <div className="recipe-list" data-testid="recipe-drawer-list">
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
                className={`recipe-card ${isCurrent ? 'recipe-card--current' : ''}`}
                data-testid={`recipe-option-${recipe.id}`}
                aria-pressed={isCurrent}
              >
                <div className="recipe-card__content">
                  <span className="recipe-card__title">{recipe.title}</span>
                  <div className="recipe-card__meta">
                    <span className="recipe-card__time">{totalTime} mins</span>
                    <span className="recipe-card__difficulty">{recipe.difficulty}</span>
                  </div>
                </div>
                {isCurrent && <span className="recipe-card__badge">Current</span>}
              </button>
            );
          };

          return (
            <>
              {hasUserRecipes && (
                <>
                  <div className="recipe-section-header">My Recipes</div>
                  {userRecipes.map(renderRecipe)}
                </>
              )}
              {hasUserRecipes && hasBuiltInRecipes && (
                <div className="recipe-section-header">More Recipes</div>
              )}
              {builtInRecipes.map(renderRecipe)}
            </>
          );
        })()}
      </div>
    </Drawer>
  );
}
