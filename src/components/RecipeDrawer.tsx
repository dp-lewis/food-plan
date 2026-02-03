'use client';

import { useEffect, useRef } from 'react';
import { Recipe, MealType } from '@/types';

interface RecipeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType | null;
  currentRecipeId: string | null;
  recipes: Recipe[];
  onSelectRecipe: (recipeId: string) => void;
  onSurpriseMe: () => void;
}

export default function RecipeDrawer({
  isOpen,
  onClose,
  mealType,
  currentRecipeId,
  recipes,
  onSelectRecipe,
  onSurpriseMe,
}: RecipeDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const mealTypeLabel = mealType ? mealType.charAt(0).toUpperCase() + mealType.slice(1) : '';

  return (
    <div className="drawer-container">
      {/* Backdrop */}
      <div
        className="drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="drawer-panel"
      >
        {/* Drag handle */}
        <div className="drawer-handle" />

        {/* Header */}
        <div className="drawer-header">
          <h2
            id="drawer-title"
            style={{
              fontSize: 'var(--font-size-body)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            Choose a {mealTypeLabel}
          </h2>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className="drawer-close-btn"
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>

        {/* Surprise me button */}
        <div className="drawer-content">
          <button
            onClick={() => {
              onSurpriseMe();
              onClose();
            }}
            className="surprise-me-btn"
            data-testid="surprise-me-btn"
          >
            Surprise me
          </button>

          {/* Recipe list */}
          <div className="recipe-list" data-testid="recipe-drawer-list">
            {recipes.map((recipe) => {
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
