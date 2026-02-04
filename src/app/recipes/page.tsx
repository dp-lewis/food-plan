'use client';

import Link from 'next/link';
import { useStore } from '@/store/store';
import { BackLink, Button, Card, EmptyState } from '@/components/ui';

export default function MyRecipes() {
  const userRecipes = useStore((state) => state.userRecipes);

  return (
    <main className="min-h-screen p-4" data-testid="my-recipes-page">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1
            style={{
              fontSize: 'var(--font-size-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            My Recipes
          </h1>
          <div className="flex gap-2">
            <Link href="/recipes/new" data-testid="create-recipe-btn">
              <Button variant="secondary" size="small">
                + Create
              </Button>
            </Link>
            <Link href="/recipes/add" data-testid="import-recipe-btn">
              <Button size="small">
                Import URL
              </Button>
            </Link>
          </div>
        </div>

        <BackLink href="/">Back to Dashboard</BackLink>

        {/* Empty state */}
        {userRecipes.length === 0 && (
          <div data-testid="empty-recipes">
            <EmptyState
              icon="📖"
              title="No recipes yet"
              description="Add your own recipes or import from your favourite food websites."
              action={
                <div className="flex flex-col gap-2">
                  <Link href="/recipes/add" data-testid="empty-import-btn">
                    <Button className="w-full">Import from URL</Button>
                  </Link>
                  <Link href="/recipes/new" data-testid="empty-create-btn">
                    <Button variant="secondary" className="w-full">
                      Create Your Own Recipe
                    </Button>
                  </Link>
                </div>
              }
            />
          </div>
        )}

        {/* Recipe list */}
        {userRecipes.length > 0 && (
          <div className="space-y-3" data-testid="recipe-list">
            {userRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                data-testid={`recipe-card-${recipe.id}`}
              >
                <Card>
                  <h2
                    style={{
                      fontSize: 'var(--font-size-body)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {recipe.title}
                  </h2>
                  <div
                    className="flex items-center gap-2 mt-1"
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <span className="capitalize">{recipe.mealType}</span>
                    <span>·</span>
                    <span>{recipe.sourceName ? `from ${recipe.sourceName}` : 'Your recipe'}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
