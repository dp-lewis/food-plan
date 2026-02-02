'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/store';

export default function UserRecipeDetail() {
  const params = useParams();
  const router = useRouter();
  const userRecipes = useStore((state) => state.userRecipes);
  const removeUserRecipe = useStore((state) => state.removeUserRecipe);

  const recipe = userRecipes.find((r) => r.id === params.id);

  const handleDelete = () => {
    if (recipe && confirm('Are you sure you want to delete this recipe?')) {
      removeUserRecipe(recipe.id);
      router.push('/recipes');
    }
  };

  if (!recipe) {
    return (
      <main className="min-h-screen p-4">
        <div className="max-w-md mx-auto text-center py-12">
          <p style={{ color: 'var(--color-text-muted)' }}>Recipe not found</p>
          <Link
            href="/recipes"
            className="mt-4 inline-block"
            style={{ color: 'var(--color-accent)' }}
          >
            Go back to My Recipes
          </Link>
        </div>
      </main>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <main className="min-h-screen p-4 pb-8" data-testid="user-recipe-page">
      <div className="max-w-md mx-auto">
        {/* Back button */}
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

        {recipe.sourceName && (
          <p
            className="mb-4"
            style={{
              fontSize: 'var(--font-size-caption)',
              color: 'var(--color-text-muted)',
            }}
          >
            Imported from {recipe.sourceName}
          </p>
        )}


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
            className="px-3 py-2 rounded-md capitalize"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <span
              className="block"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
            >
              Meal type
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              {recipe.mealType}
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

        {/* View Recipe Link */}
        {recipe.sourceUrl && (
          <section className="mb-6">
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-4 rounded-lg"
              data-testid="view-recipe-link"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-text-inverse)',
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              View Recipe on {recipe.sourceName || 'Original Site'} →
            </a>
            <p
              className="text-center mt-2"
              style={{
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-text-muted)',
              }}
            >
              Cooking instructions are on the original website
            </p>
          </section>
        )}

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="w-full py-2 rounded-lg"
          data-testid="delete-recipe-btn"
          style={{
            backgroundColor: 'transparent',
            border: 'var(--border-width) solid var(--color-error, #c00)',
            color: 'var(--color-error, #c00)',
            fontSize: 'var(--font-size-caption)',
          }}
        >
          Delete Recipe
        </button>
      </div>
    </main>
  );
}
