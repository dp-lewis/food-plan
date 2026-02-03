'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { parseIngredient } from '@/lib/ingredientParser';
import { MealType, Difficulty, BudgetLevel, Ingredient, IngredientCategory } from '@/types';

const CATEGORIES: IngredientCategory[] = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'uncategorized'];

interface IngredientInput {
  raw: string;
  parsed: Ingredient;
}

export default function NewRecipe() {
  const router = useRouter();
  const addUserRecipe = useStore((state) => state.addUserRecipe);

  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [prepTime, setPrepTime] = useState(0);
  const [cookTime, setCookTime] = useState(0);
  const [servings, setServings] = useState(4);
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<IngredientInput[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [saving, setSaving] = useState(false);

  const addIngredient = () => {
    if (!newIngredient.trim()) return;

    const parsed = parseIngredient(newIngredient.trim());
    setIngredients([...ingredients, { raw: newIngredient.trim(), parsed }]);
    setNewIngredient('');
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredientCategory = (index: number, category: IngredientCategory) => {
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      parsed: { ...updated[index].parsed, category },
    };
    setIngredients(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  const canSave = title.trim() && ingredients.length > 0;

  const handleSave = () => {
    if (!canSave) return;

    setSaving(true);

    const recipe = {
      id: `user-${Date.now()}`,
      title: title.trim(),
      description: '',
      mealType,
      prepTime,
      cookTime,
      servings,
      difficulty: 'easy' as Difficulty,
      tags: [],
      estimatedCost: 'medium' as BudgetLevel,
      ingredients: ingredients.map((i) => i.parsed),
      instructions: [],
      isUserRecipe: true,
      notes: notes.trim() || undefined,
    };

    addUserRecipe(recipe);
    router.push('/recipes');
  };

  return (
    <main className="min-h-screen p-4 pb-8" data-testid="new-recipe-page">
      <div className="max-w-md mx-auto">
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1 mb-4"
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-text-muted)',
          }}
        >
          ← Back to My Recipes
        </Link>

        <h1
          className="mb-2"
          style={{
            fontSize: 'var(--font-size-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
          }}
        >
          Create Recipe
        </h1>

        <p
          className="mb-6"
          style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Add a simple recipe for your family meals.
        </p>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="title-input"
              className="block mb-1"
              style={{
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Title *
            </label>
            <input
              type="text"
              id="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Schnitzel and salad"
              className="w-full px-3 py-2 rounded-lg"
              data-testid="title-input"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: 'var(--border-width) solid var(--color-border)',
                fontSize: 'var(--font-size-body)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Meal Type */}
          <div>
            <label
              htmlFor="meal-type-select"
              className="block mb-1"
              style={{
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Meal Type *
            </label>
            <select
              id="meal-type-select"
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className="w-full px-3 py-2 rounded-lg"
              data-testid="meal-type-select"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: 'var(--border-width) solid var(--color-border)',
                fontSize: 'var(--font-size-body)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>

          {/* Time & Servings */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="prep-time-input"
                className="block mb-1"
                style={{
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Prep (min)
              </label>
              <input
                type="number"
                id="prep-time-input"
                value={prepTime}
                onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 rounded-lg"
                data-testid="prep-time-input"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: 'var(--border-width) solid var(--color-border)',
                  fontSize: 'var(--font-size-body)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            <div>
              <label
                htmlFor="cook-time-input"
                className="block mb-1"
                style={{
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Cook (min)
              </label>
              <input
                type="number"
                id="cook-time-input"
                value={cookTime}
                onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 rounded-lg"
                data-testid="cook-time-input"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: 'var(--border-width) solid var(--color-border)',
                  fontSize: 'var(--font-size-body)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            <div>
              <label
                htmlFor="servings-input"
                className="block mb-1"
                style={{
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Servings
              </label>
              <input
                type="number"
                id="servings-input"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 rounded-lg"
                data-testid="servings-input"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: 'var(--border-width) solid var(--color-border)',
                  fontSize: 'var(--font-size-body)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label
              className="block mb-1"
              style={{
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Ingredients *
            </label>

            {/* Ingredient list */}
            {ingredients.length > 0 && (
              <div
                className="rounded-lg overflow-hidden mb-2"
                data-testid="ingredients-list"
                style={{
                  border: 'var(--border-width) solid var(--color-border)',
                }}
              >
                {ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2"
                    data-testid={`ingredient-${index}`}
                    style={{
                      backgroundColor: index % 2 === 0 ? 'var(--color-bg-primary)' : 'var(--color-bg-tertiary)',
                    }}
                  >
                    <span
                      className="flex-1 truncate"
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {ing.parsed.quantity} {ing.parsed.unit} {ing.parsed.name}
                    </span>
                    <select
                      value={ing.parsed.category}
                      onChange={(e) => updateIngredientCategory(index, e.target.value as IngredientCategory)}
                      className="px-2 py-1 rounded text-xs"
                      data-testid={`category-${index}`}
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        border: 'var(--border-width) solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeIngredient(index)}
                      className="p-1 rounded"
                      data-testid={`remove-ingredient-${index}`}
                      aria-label={`Remove ${ing.parsed.name}`}
                      style={{
                        color: 'var(--color-error, #c00)',
                        fontSize: 'var(--font-size-caption)',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add ingredient input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., 2 chicken schnitzels"
                className="flex-1 px-3 py-2 rounded-lg"
                data-testid="new-ingredient-input"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: 'var(--border-width) solid var(--color-border)',
                  fontSize: 'var(--font-size-body)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <button
                onClick={addIngredient}
                disabled={!newIngredient.trim()}
                className="px-4 py-2 rounded-lg"
                data-testid="add-ingredient-btn"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: 'var(--border-width) solid var(--color-border)',
                  fontSize: 'var(--font-size-caption)',
                  color: 'var(--color-text-primary)',
                  opacity: !newIngredient.trim() ? 0.5 : 1,
                }}
              >
                Add
              </button>
            </div>
            <p
              className="mt-1"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
            >
              Press Enter or click Add after each ingredient
            </p>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes-input"
              className="block mb-1"
              style={{
                fontSize: 'var(--font-size-caption)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Notes (optional)
            </label>
            <textarea
              id="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any brief reminders for this recipe..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg resize-none"
              data-testid="notes-input"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: 'var(--border-width) solid var(--color-border)',
                fontSize: 'var(--font-size-body)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="primary-button w-full"
            data-testid="save-recipe-btn"
            style={{
              opacity: !canSave || saving ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Recipe'}
          </button>

          {!canSave && (
            <p
              role="status"
              aria-live="polite"
              className="text-center"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
            >
              Add a title and at least one ingredient to save
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
