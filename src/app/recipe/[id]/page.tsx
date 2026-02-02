'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRecipeById } from '@/data/recipes';

export default function RecipeDetail() {
  const params = useParams();
  const router = useRouter();
  const recipe = getRecipeById(params.id as string);

  if (!recipe) {
    return (
      <main className="min-h-screen p-4">
        <div className="max-w-md mx-auto text-center py-12">
          <p style={{ color: 'var(--color-text-muted)' }}>Recipe not found</p>
          <Link
            href="/"
            className="mt-4 inline-block"
            style={{ color: 'var(--color-accent)' }}
          >
            Go back home
          </Link>
        </div>
      </main>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <main className="min-h-screen p-4 pb-8" data-testid="recipe-page">
      <div className="max-w-md mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 mb-4"
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-text-muted)',
          }}
        >
          ← Back
        </button>

        {/* Header */}
        <h1
          className="mb-2"
          data-testid="recipe-title"
          style={{
            fontSize: 'var(--font-size-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          {recipe.title}
        </h1>

        <p
          className="mb-4"
          style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {recipe.description}
        </p>

        {/* Meta info */}
        <div
          className="flex flex-wrap gap-3 mb-6 pb-6"
          style={{ borderBottom: 'var(--border-width) solid var(--color-border)' }}
        >
          <div
            className="px-3 py-2 rounded-md"
            data-testid="recipe-time"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <span
              className="block"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
            >
              Total time
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              {totalTime} mins
            </span>
          </div>

          <div
            className="px-3 py-2 rounded-md"
            data-testid="recipe-servings"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <span
              className="block"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
            >
              Servings
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              {recipe.servings}
            </span>
          </div>

          <div
            className="px-3 py-2 rounded-md"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <span
              className="block"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
            >
              Difficulty
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
            </span>
          </div>

          <div
            className="px-3 py-2 rounded-md"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <span
              className="block"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
            >
              Cost
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              {recipe.estimatedCost.charAt(0).toUpperCase() + recipe.estimatedCost.slice(1)}
            </span>
          </div>
        </div>

        {/* Ingredients */}
        <section className="mb-6">
          <h2
            className="mb-3"
            style={{
              fontSize: 'var(--font-size-body)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            Ingredients
          </h2>
          <ul className="space-y-2" data-testid="ingredients-list">
            {recipe.ingredients.map((ing, index) => (
              <li
                key={index}
                className="flex items-center gap-3"
                style={{
                  fontSize: 'var(--font-size-body)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span
                  className="w-5 h-5 rounded border flex-shrink-0"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                <span>
                  {ing.quantity} {ing.unit} {ing.name}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Instructions */}
        <section>
          <h2
            className="mb-3"
            style={{
              fontSize: 'var(--font-size-body)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            Instructions
          </h2>
          <ol className="space-y-4" data-testid="instructions-list">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-text-inverse)',
                    fontSize: 'var(--font-size-caption)',
                    fontWeight: 'var(--font-weight-bold)',
                  }}
                >
                  {index + 1}
                </span>
                <p
                  style={{
                    fontSize: 'var(--font-size-body)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
