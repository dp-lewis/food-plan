'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/store';
import { MetaChip, Button, PageHeader } from '@/components/ui';

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
      <div className="min-h-screen bg-background">
        <PageHeader title="Recipe" backHref="/recipes" />
        <main className="max-w-md mx-auto px-4 py-6 pb-6 space-y-6">
          <div className="text-center py-12">
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
      </div>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="min-h-screen bg-background" data-testid="user-recipe-page">
      <PageHeader title={recipe.title} backHref="/recipes" titleTestId="recipe-title" />
      <main className="max-w-md mx-auto px-4 py-6 pb-6 space-y-6">
        <p
          data-testid="recipe-source"
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-text-muted)',
          }}
        >
          {recipe.sourceName ? `Imported from ${recipe.sourceName}` : 'Your recipe'}
        </p>

        {/* Meta info */}
        <div
          className="flex flex-wrap gap-3 mb-6 pb-6"
          style={{ borderBottom: 'var(--border-width) solid var(--color-border)' }}
        >
          <div data-testid="recipe-time">
            <MetaChip label="Total time" value={`${totalTime} mins`} />
          </div>
          <div data-testid="recipe-servings">
            <MetaChip label="Servings" value={recipe.servings} />
          </div>
          <MetaChip
            label="Meal type"
            value={recipe.mealType.charAt(0).toUpperCase() + recipe.mealType.slice(1)}
          />
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
                  aria-hidden="true"
                />
                <span>
                  {ing.quantity} {ing.unit} {ing.name}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Notes */}
        {recipe.notes && (
          <section className="mb-6">
            <h2
              className="mb-2"
              style={{
                fontSize: 'var(--font-size-body)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Notes
            </h2>
            <p
              data-testid="recipe-notes"
              className="p-3 rounded-lg"
              style={{
                fontSize: 'var(--font-size-body)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-tertiary)',
              }}
            >
              {recipe.notes}
            </p>
          </section>
        )}

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
        <Button
          variant="secondary"
          onClick={handleDelete}
          data-testid="delete-recipe-btn"
          style={{
            width: '100%',
            borderColor: 'var(--color-error, #c00)',
            color: 'var(--color-error, #c00)',
          }}
        >
          Delete Recipe
        </Button>
      </main>
    </div>
  );
}
