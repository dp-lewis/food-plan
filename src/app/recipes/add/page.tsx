'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { ParsedRecipe } from '@/lib/recipeParser';
import { parseIngredient } from '@/lib/ingredientParser';
import { MealType, Difficulty, BudgetLevel, Ingredient, IngredientCategory } from '@/types';

type Step = 'url' | 'preview' | 'saving';

const CATEGORIES: IngredientCategory[] = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'uncategorized'];

export default function AddRecipe() {
  const router = useRouter();
  const addUserRecipe = useStore((state) => state.addUserRecipe);

  const [step, setStep] = useState<Step>('url');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);

  // Editable fields for preview
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(30);
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>([]);

  const handleFetchRecipe = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to parse recipe');
        setLoading(false);
        return;
      }

      setParsedRecipe(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setPrepTime(data.prepTime || 15);
      setCookTime(data.cookTime || 30);
      setServings(data.servings || 4);
      setInstructions(data.instructions || []);

      // Parse ingredients with auto-categorization
      const parsedIngredients = (data.ingredients || []).map((raw: string) =>
        parseIngredient(raw)
      );
      setIngredients(parsedIngredients);

      setStep('preview');
    } catch {
      setError('Failed to fetch recipe. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!parsedRecipe) return;

    setStep('saving');

    const recipe = {
      id: `user-${Date.now()}`,
      title,
      description,
      mealType,
      prepTime,
      cookTime,
      servings,
      difficulty: 'medium' as Difficulty,
      tags: [],
      estimatedCost: 'medium' as BudgetLevel,
      ingredients,
      instructions,
      sourceUrl: parsedRecipe.sourceUrl,
      sourceName: parsedRecipe.sourceName,
      isUserRecipe: true,
    };

    addUserRecipe(recipe);
    router.push('/recipes');
  };

  const updateIngredientCategory = (index: number, category: IngredientCategory) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], category };
    setIngredients(updated);
  };

  // URL Input Step
  if (step === 'url') {
    return (
      <main className="min-h-screen p-4" data-testid="add-recipe-page">
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
            Import Recipe from URL
          </h1>

          <p
            className="mb-6"
            style={{
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Paste a recipe URL from sites like RecipeTin Eats, BBC Good Food, or any site with structured recipe data.
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="url"
                className="block mb-2"
                style={{
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Recipe URL
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.recipetineats.com/..."
                className="w-full px-3 py-2 rounded-lg"
                data-testid="url-input"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: 'var(--border-width) solid var(--color-border)',
                  fontSize: 'var(--font-size-body)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {error && (
              <p
                className="text-center py-2 px-3 rounded"
                data-testid="error-message"
                style={{
                  backgroundColor: 'var(--color-error-light, #fee)',
                  color: 'var(--color-error, #c00)',
                  fontSize: 'var(--font-size-caption)',
                }}
              >
                {error}
              </p>
            )}

            <button
              onClick={handleFetchRecipe}
              disabled={!url || loading}
              className="primary-button w-full"
              data-testid="fetch-recipe-btn"
              style={{
                opacity: !url || loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Fetching...' : 'Fetch Recipe'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Preview/Edit Step
  if (step === 'preview' || step === 'saving') {
    return (
      <main className="min-h-screen p-4 pb-8" data-testid="preview-recipe-page">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setStep('url')}
            className="inline-flex items-center gap-1 mb-4"
            style={{
              fontSize: 'var(--font-size-caption)',
              color: 'var(--color-text-muted)',
            }}
          >
            ← Back to URL
          </button>

          <h1
            className="mb-2"
            style={{
              fontSize: 'var(--font-size-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            Review & Save
          </h1>

          <p
            className="mb-6"
            style={{
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Review the imported data and make any corrections before saving.
          </p>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label
                className="block mb-1"
                style={{
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                className="block mb-1"
                style={{
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Meal Type
              </label>
              <select
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
                  value={prepTime}
                  onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg"
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
                  value={cookTime}
                  onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg"
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
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg"
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
                className="block mb-2"
                style={{
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Ingredients ({ingredients.length})
              </label>
              <div
                className="rounded-lg overflow-hidden"
                style={{
                  border: 'var(--border-width) solid var(--color-border)',
                }}
              >
                {ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2"
                    style={{
                      backgroundColor: index % 2 === 0 ? 'var(--color-bg-primary)' : 'var(--color-bg-tertiary)',
                    }}
                  >
                    <span
                      className="flex-1 truncate mr-2"
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {ing.quantity} {ing.unit} {ing.name}
                    </span>
                    <select
                      value={ing.category}
                      onChange={(e) => updateIngredientCategory(index, e.target.value as IngredientCategory)}
                      className="px-2 py-1 rounded text-xs"
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
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions Preview */}
            <div>
              <label
                className="block mb-2"
                style={{
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Instructions ({instructions.length} steps)
              </label>
              <div
                className="rounded-lg p-3"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  maxHeight: '150px',
                  overflow: 'auto',
                }}
              >
                <ol
                  className="space-y-2"
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {instructions.slice(0, 3).map((step, index) => (
                    <li key={index} className="flex gap-2">
                      <span style={{ color: 'var(--color-accent)' }}>{index + 1}.</span>
                      <span className="line-clamp-2">{step}</span>
                    </li>
                  ))}
                  {instructions.length > 3 && (
                    <li style={{ color: 'var(--color-text-muted)' }}>
                      ... and {instructions.length - 3} more steps
                    </li>
                  )}
                </ol>
              </div>
            </div>

            {/* Source */}
            {parsedRecipe?.sourceName && (
              <p
                style={{
                  fontSize: 'var(--font-size-caption)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Source: {parsedRecipe.sourceName}
              </p>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={step === 'saving' || !title}
              className="primary-button w-full"
              data-testid="save-recipe-btn"
              style={{
                opacity: step === 'saving' || !title ? 0.5 : 1,
              }}
            >
              {step === 'saving' ? 'Saving...' : 'Save Recipe'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
