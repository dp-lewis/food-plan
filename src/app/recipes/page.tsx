'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/store';
import { BottomNav, Button, Card, EmptyState, Drawer, PageHeader } from '@/components/ui';
import { buttonVariants } from '@/components/ui/Button';
import { LinkIcon } from 'lucide-react';

export default function MyRecipes() {
  const router = useRouter();
  const userRecipes = useStore((state) => state.userRecipes);
  const setPendingImportedRecipe = useStore((state) => state.setPendingImportedRecipe);

  const [isImportDrawerOpen, setIsImportDrawerOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when drawer opens
  useEffect(() => {
    if (isImportDrawerOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isImportDrawerOpen]);

  const handleFetchRecipe = async () => {
    if (!importUrl.trim()) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to parse recipe');
        setIsLoading(false);
        return;
      }

      // Store the parsed recipe and navigate to preview
      setPendingImportedRecipe(data);
      setIsImportDrawerOpen(false);
      setImportUrl('');
      router.push('/recipes/add');
    } catch {
      setError('Failed to fetch recipe. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openImportDrawer = () => {
    setError(null);
    setIsImportDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="my-recipes-page">
      <PageHeader title="My Recipes" backHref="/" sticky />
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6 pb-40 space-y-6">
        {/* Empty state */}
        {userRecipes.length === 0 && (
          <div data-testid="empty-recipes">
            <EmptyState
              icon="📖"
              title="No recipes yet"
              description="Add your own recipes or import from your favourite food websites."
              action={
                <div className="flex flex-col gap-2">
                  <Button onClick={openImportDrawer} className="w-full" data-testid="empty-import-btn">
                    Import from URL
                  </Button>
                  <Link
                    href="/recipes/new"
                    data-testid="empty-create-btn"
                    className={buttonVariants({ variant: 'secondary' }) + ' w-full'}
                  >
                    Create Your Own Recipe
                  </Link>
                </div>
              }
            />
          </div>
        )}

        {/* Recipe list */}
        {userRecipes.length > 0 && (
          <div className="space-y-4" data-testid="recipe-list">
            {userRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                data-testid={`recipe-card-${recipe.id}`}
                className="block"
              >
                <Card>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h2 className="text-base font-semibold text-foreground">
                        {recipe.title}
                      </h2>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span className="capitalize">{recipe.mealType}</span>
                        <span>·</span>
                        <span>{recipe.sourceName ? `from ${recipe.sourceName}` : 'Your recipe'}</span>
                      </div>
                    </div>
                    {recipe.sourceUrl && (
                      <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    )}
                  </div>
                </Card>
              </Link>
            ))}

            <Link
              href="/recipes/new"
              data-testid="create-recipe-btn"
              className={buttonVariants({ variant: 'secondary' }) + ' w-full'}
            >
              + Create Your Own Recipe
            </Link>
          </div>
        )}
      </main>

      <Drawer
        isOpen={isImportDrawerOpen}
        onClose={() => setIsImportDrawerOpen(false)}
        title="Import Recipe"
      >
        <div data-testid="import-recipe-drawer">
          <div className="flex gap-2">
            <label htmlFor="import-url-input" className="sr-only">
              Recipe URL
            </label>
            <input
              ref={inputRef}
              id="import-url-input"
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && importUrl.trim() && !isLoading) {
                  e.preventDefault();
                  handleFetchRecipe();
                }
              }}
              placeholder="https://www.recipetineats.com/..."
              className="flex-1 bg-background border border-border text-base text-foreground px-3 py-2 rounded-sm"
              data-testid="import-url-input"
              aria-describedby={error ? 'import-error' : undefined}
            />
          </div>
          {error && (
            <p
              id="import-error"
              role="alert"
              className="mt-2 text-sm text-destructive"
              data-testid="import-error"
            >
              {error}
            </p>
          )}
          <p className="mt-2 mb-4 text-sm text-muted-foreground">
            Paste a recipe URL from sites like RecipeTin Eats, BBC Good Food, or any site with structured recipe data.
          </p>
          <Button
            onClick={handleFetchRecipe}
            disabled={!importUrl.trim() || isLoading}
            data-testid="fetch-recipe-btn"
            className="w-full"
          >
            {isLoading ? 'Fetching...' : 'Fetch Recipe'}
          </Button>
        </div>
      </Drawer>

      <BottomNav onImportClick={openImportDrawer} />
    </div>
  );
}
