'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { parseIngredient } from '@/lib/ingredientParser';
import { MealType, Difficulty, BudgetLevel, Ingredient, IngredientCategory } from '@/types';
import { Input, Select, Button, PageHeader } from '@/components/ui';

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
  const [prepTime, setPrepTime] = useState('0');
  const [cookTime, setCookTime] = useState('0');
  const [servings, setServings] = useState('4');
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
      prepTime: parseInt(prepTime) || 0,
      cookTime: parseInt(cookTime) || 0,
      servings: parseInt(servings) || 1,
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
    <div className="min-h-screen bg-background" data-testid="new-recipe-page">
      <PageHeader title="Create Recipe" backHref="/recipes" sticky />
      <main id="main-content" className="max-w-md mx-auto px-4 py-6 pb-6 space-y-6">
        <p className="text-base text-muted-foreground">
          Add a simple recipe for your family meals.
        </p>

        <div className="space-y-4">
          <Input
            label="Title *"
            value={title}
            onChange={setTitle}
            placeholder="e.g., Schnitzel and salad"
            id="title-input"
            data-testid="title-input"
          />

          <Select
            label="Meal Type *"
            value={mealType}
            onChange={(value) => setMealType(value as MealType)}
            options={[
              { value: 'breakfast', label: 'Breakfast' },
              { value: 'lunch', label: 'Lunch' },
              { value: 'dinner', label: 'Dinner' },
            ]}
            id="meal-type-select"
            data-testid="meal-type-select"
          />

          {/* Time & Servings */}
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Prep (min)"
              type="number"
              value={prepTime}
              onChange={setPrepTime}
              min="0"
              id="prep-time-input"
              data-testid="prep-time-input"
            />
            <Input
              label="Cook (min)"
              type="number"
              value={cookTime}
              onChange={setCookTime}
              min="0"
              id="cook-time-input"
              data-testid="cook-time-input"
            />
            <Input
              label="Servings"
              type="number"
              value={servings}
              onChange={setServings}
              min="1"
              id="servings-input"
              data-testid="servings-input"
            />
          </div>

          {/* Ingredients */}
          <div>
            <label className="block mb-1 text-sm font-semibold text-foreground">
              Ingredients *
            </label>

            {/* Ingredient list */}
            {ingredients.length > 0 && (
              <div
                className="rounded-lg overflow-hidden mb-2 border border-border"
                data-testid="ingredients-list"
              >
                {ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-3 py-2 ${index % 2 === 0 ? 'bg-background' : 'bg-muted'}`}
                    data-testid={`ingredient-${index}`}
                  >
                    <span className="flex-1 truncate text-sm text-muted-foreground">
                      {ing.parsed.quantity} {ing.parsed.unit} {ing.parsed.name}
                    </span>
                    <select
                      value={ing.parsed.category}
                      onChange={(e) => updateIngredientCategory(index, e.target.value as IngredientCategory)}
                      className="px-2 py-1 rounded text-xs bg-background border border-border text-foreground"
                      data-testid={`category-${index}`}
                      aria-label={`Category for ${ing.parsed.name}`}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeIngredient(index)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-destructive text-sm"
                      data-testid={`remove-ingredient-${index}`}
                      aria-label={`Remove ${ing.parsed.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add ingredient input */}
            <div className="flex gap-2">
              <label htmlFor="new-ingredient-input" className="sr-only">
                Add ingredient
              </label>
              <input
                id="new-ingredient-input"
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., 2 chicken schnitzels"
                className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-base text-foreground"
                data-testid="new-ingredient-input"
                aria-describedby="ingredient-hint"
              />
              <Button
                variant="secondary"
                onClick={addIngredient}
                disabled={!newIngredient.trim()}
                data-testid="add-ingredient-btn"
              >
                Add
              </Button>
            </div>
            <p
              id="ingredient-hint"
              className="mt-1 text-sm text-muted-foreground"
            >
              Press Enter or click Add after each ingredient
            </p>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes-input"
              className="block mb-1 text-sm font-semibold text-foreground"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any brief reminders for this recipe..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg resize-none bg-background border border-border text-base text-foreground"
              data-testid="notes-input"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full"
            data-testid="save-recipe-btn"
          >
            {saving ? 'Saving...' : 'Save Recipe'}
          </Button>

          {!canSave && (
            <p
              role="status"
              aria-live="polite"
              className="text-center text-sm text-muted-foreground"
            >
              Add a title and at least one ingredient to save
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
