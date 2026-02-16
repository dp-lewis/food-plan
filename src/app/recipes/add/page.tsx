'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { ParsedRecipe } from '@/lib/recipeParser';
import { parseIngredient } from '@/lib/ingredientParser';
import { MealType, Difficulty, BudgetLevel, Ingredient, IngredientCategory } from '@/types';
import { Input, Select, Alert, Button, Card, PageHeader } from '@/components/ui';

type Step = 'url' | 'preview' | 'saving';

const CATEGORIES: IngredientCategory[] = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'uncategorized'];

export default function AddRecipe() {
  const router = useRouter();
  const addUserRecipe = useStore((state) => state.addUserRecipe);
  const pendingImportedRecipe = useStore((state) => state.pendingImportedRecipe);
  const setPendingImportedRecipe = useStore((state) => state.setPendingImportedRecipe);

  const [step, setStep] = useState<Step>('url');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);

  // Editable fields for preview
  const [title, setTitle] = useState('');
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [prepTime, setPrepTime] = useState('15');
  const [cookTime, setCookTime] = useState('30');
  const [servings, setServings] = useState('4');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Check for pending imported recipe on mount
  useEffect(() => {
    if (pendingImportedRecipe) {
      // Load the pending recipe into the form
      setParsedRecipe(pendingImportedRecipe);
      setTitle(pendingImportedRecipe.title);
      setPrepTime(String(pendingImportedRecipe.prepTime || 15));
      setCookTime(String(pendingImportedRecipe.cookTime || 30));
      setServings(String(pendingImportedRecipe.servings || 4));

      // Parse ingredients with auto-categorization
      const parsedIngredients = (pendingImportedRecipe.ingredients || []).map((raw: string) =>
        parseIngredient(raw)
      );
      setIngredients(parsedIngredients);

      // Clear the pending recipe from store and go to preview
      setPendingImportedRecipe(null);
      setStep('preview');
    }
  }, [pendingImportedRecipe, setPendingImportedRecipe]);

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
      setPrepTime(String(data.prepTime || 15));
      setCookTime(String(data.cookTime || 30));
      setServings(String(data.servings || 4));

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
      prepTime: parseInt(prepTime) || 0,
      cookTime: parseInt(cookTime) || 0,
      servings: parseInt(servings) || 1,
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
      <div className="min-h-screen bg-background" data-testid="add-recipe-page">
        <PageHeader title="Import Recipe" backHref="/recipes" sticky />
        <main id="main-content" className="max-w-md mx-auto px-4 py-6 pb-6 space-y-6">
          <p className="text-base text-muted-foreground">
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
        </main>
      </div>
    );
  }

  // Preview/Edit Step
  if (step === 'preview' || step === 'saving') {
    return (
      <div className="min-h-screen bg-background" data-testid="preview-recipe-page">
        <PageHeader title="Review & Save" onBack={() => setStep('url')} sticky />
        <main id="main-content" className="max-w-md mx-auto px-4 py-6 pb-6 space-y-6">
          <p className="text-base text-muted-foreground">
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
                value={prepTime}
                onChange={setPrepTime}
                min="0"
              />
              <Input
                label="Cook (min)"
                type="number"
                value={cookTime}
                onChange={setCookTime}
                min="0"
              />
              <Input
                label="Servings"
                type="number"
                value={servings}
                onChange={setServings}
                min="1"
              />
            </div>

            {/* Ingredients */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-foreground">
                Ingredients ({ingredients.length})
              </label>
              <div className="rounded-lg overflow-hidden border border-border">
                {ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between px-3 py-2 ${index % 2 === 0 ? 'bg-background' : 'bg-muted'}`}
                  >
                    <span className="flex-1 truncate mr-2 text-sm text-muted-foreground">
                      {ing.quantity} {ing.unit} {ing.name}
                    </span>
                    <select
                      value={ing.category}
                      onChange={(e) => updateIngredientCategory(index, e.target.value as IngredientCategory)}
                      className="px-2 py-1 rounded text-xs bg-background border border-border text-foreground"
                      aria-label={`Category for ${ing.name}`}
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
                <p className="mb-2 text-sm font-semibold text-foreground">
                  Recipe method
                </p>
                <p className="text-sm text-muted-foreground">
                  The cooking instructions will remain on the original website. When you cook this recipe, you&apos;ll be linked to{' '}
                  <a
                    href={parsedRecipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary"
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
        </main>
      </div>
    );
  }

  return null;
}
