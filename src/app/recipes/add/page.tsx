'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { ParsedRecipe } from '@/lib/recipeParser';
import { parseIngredient } from '@/lib/ingredientParser';
import { MealType, Difficulty, BudgetLevel, Ingredient, IngredientCategory } from '@/types';
import { BackLink, Input, Select, Alert, Button, Card } from '@/components/ui';

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
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(30);
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

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
      setPrepTime(data.prepTime || 15);
      setCookTime(data.cookTime || 30);
      setServings(data.servings || 4);

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
      description: '',
      mealType,
      prepTime,
      cookTime,
      servings,
      difficulty: 'medium' as Difficulty,
      tags: [],
      estimatedCost: 'medium' as BudgetLevel,
      ingredients,
      instructions: [],
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
          <BackLink href="/recipes">Back to My Recipes</BackLink>

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
            <Input
              label="Recipe URL"
              type="url"
              value={url}
              onChange={setUrl}
              placeholder="https://www.recipetineats.com/..."
              id="url"
              data-testid="url-input"
              error={error || undefined}
            />

            {error && (
              <Alert variant="error" data-testid="error-message">
                {error}
              </Alert>
            )}

            <Button
              onClick={handleFetchRecipe}
              disabled={!url || loading}
              className="w-full"
              data-testid="fetch-recipe-btn"
            >
              {loading ? 'Fetching...' : 'Fetch Recipe'}
            </Button>
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
            <Input
              label="Title"
              value={title}
              onChange={setTitle}
              data-testid="title-input"
            />

            <Select
              label="Meal Type"
              value={mealType}
              onChange={(value) => setMealType(value as MealType)}
              options={[
                { value: 'breakfast', label: 'Breakfast' },
                { value: 'lunch', label: 'Lunch' },
                { value: 'dinner', label: 'Dinner' },
              ]}
              data-testid="meal-type-select"
            />

            {/* Time & Servings - keep grid layout */}
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Prep (min)"
                type="number"
                value={String(prepTime)}
                onChange={(v) => setPrepTime(parseInt(v) || 0)}
              />
              <Input
                label="Cook (min)"
                type="number"
                value={String(cookTime)}
                onChange={(v) => setCookTime(parseInt(v) || 0)}
              />
              <Input
                label="Servings"
                type="number"
                value={String(servings)}
                onChange={(v) => setServings(parseInt(v) || 1)}
              />
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

            {/* Source notice */}
            {parsedRecipe?.sourceName && parsedRecipe?.sourceUrl && (
              <Card>
                <p
                  className="mb-2"
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Recipe method
                </p>
                <p
                  style={{
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  The cooking instructions will remain on the original website. When you cook this recipe, you&apos;ll be linked to{' '}
                  <a
                    href={parsedRecipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {parsedRecipe.sourceName}
                  </a>
                  .
                </p>
              </Card>
            )}

            <Button
              onClick={handleSave}
              disabled={step === 'saving' || !title}
              className="w-full"
              data-testid="save-recipe-btn"
            >
              {step === 'saving' ? 'Saving...' : 'Save Recipe'}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
