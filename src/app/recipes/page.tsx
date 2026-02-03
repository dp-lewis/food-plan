'use client';

import Link from 'next/link';
import { useStore } from '@/store/store';

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
            <Link
              href="/recipes/new"
              className="px-3 py-2 rounded-lg inline-flex items-center"
              data-testid="create-recipe-btn"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                border: 'var(--border-width) solid var(--color-border)',
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-primary)',
              }}
            >
              + Create
            </Link>
            <Link
              href="/recipes/add"
              className="primary-button inline-flex items-center"
              data-testid="import-recipe-btn"
            >
              Import URL
            </Link>
          </div>
        </div>

        {/* Back to dashboard */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 mb-4"
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-text-muted)',
          }}
        >
          ← Back to Dashboard
        </Link>

        {/* Empty state */}
        {userRecipes.length === 0 && (
          <div
            className="rounded-lg p-8 text-center"
            data-testid="empty-recipes"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: 'var(--border-width) solid var(--color-border)',
            }}
          >
            <div
              className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: 'var(--color-accent-light)' }}
            >
              📖
            </div>
            <p
              className="mb-2"
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              No recipes yet
            </p>
            <p
              className="mb-4"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
            >
              Add your own recipes or import from your favourite food websites.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/recipes/new"
                className="primary-button inline-flex items-center justify-center"
                data-testid="empty-create-btn"
              >
                Create Your Own Recipe
              </Link>
              <Link
                href="/recipes/add"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg"
                data-testid="empty-import-btn"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  border: 'var(--border-width) solid var(--color-border)',
                  fontSize: 'var(--font-size-body)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Import from URL
              </Link>
            </div>
          </div>
        )}

        {/* Recipe list */}
        {userRecipes.length > 0 && (
          <div className="space-y-3" data-testid="recipe-list">
            {userRecipes.map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="block rounded-lg p-4"
                data-testid={`recipe-card-${recipe.id}`}
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  border: 'var(--border-width) solid var(--color-border)',
                }}
              >
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
