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
            <p className="text-muted-foreground">Recipe not found</p>
            <Link
              href="/recipes"
              className="mt-4 inline-block text-primary"
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
          className="text-sm text-muted-foreground"
        >
          {recipe.sourceName ? `Imported from ${recipe.sourceName}` : 'Your recipe'}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-border">
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
          <h2 className="mb-3 text-base font-semibold text-foreground">
            Ingredients
          </h2>
          <ul className="space-y-2" data-testid="ingredients-list">
            {recipe.ingredients.map((ing, index) => (
              <li
                key={index}
                className="flex items-center gap-3 text-base text-muted-foreground"
              >
                <span
                  className="w-5 h-5 rounded border border-border flex-shrink-0"
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
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Notes
            </h2>
            <p
              data-testid="recipe-notes"
              className="p-3 rounded-lg text-base text-muted-foreground bg-muted"
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
              className="block w-full text-center py-4 rounded-lg bg-primary text-primary-foreground text-base font-semibold"
              data-testid="view-recipe-link"
            >
              View Recipe on {recipe.sourceName || 'Original Site'} →
            </a>
            <p className="text-center mt-2 text-sm text-muted-foreground">
              Cooking instructions are on the original website
            </p>
          </section>
        )}

        {/* Delete button */}
        <Button
          variant="secondary"
          onClick={handleDelete}
          data-testid="delete-recipe-btn"
          className="w-full border-destructive text-destructive"
        >
          Delete Recipe
        </Button>
      </main>
    </div>
  );
}
