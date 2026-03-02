'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRecipeById } from '@/data/recipes';
import { BottomNav, MetaChip, PageHeader } from '@/components/ui';
import { Clock, Users, ChefHat, DollarSign } from 'lucide-react';

export default function RecipeDetail() {
  const params = useParams();
  const router = useRouter();
  const recipe = getRecipeById(params.id as string);

  if (!recipe) {
    return (
      <div className="min-h-screen bg-primary">
        <PageHeader title="Recipe" onBack={() => router.back()} sticky />
        <main className="bg-background rounded-t-3xl max-w-md mx-auto px-4 py-6 pb-6 space-y-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Recipe not found</p>
            <Link
              href="/"
              className="mt-4 inline-block text-primary"
            >
              Go back home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="min-h-screen bg-primary" data-testid="recipe-page">
      <PageHeader title={recipe.title} onBack={() => router.back()} titleTestId="recipe-title" sticky />
      <main className="bg-background rounded-t-3xl max-w-md mx-auto px-4 py-6 pb-40 space-y-6">
        <p className="text-base text-muted-foreground">
          {recipe.description}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b border-border">
          <div data-testid="recipe-time">
            <MetaChip label="Total time" value={`${totalTime} mins`} icon={<Clock className="w-4 h-4" />} />
          </div>
          <div data-testid="recipe-servings">
            <MetaChip label="Servings" value={recipe.servings} icon={<Users className="w-4 h-4" />} />
          </div>
          <MetaChip
            label="Difficulty"
            value={recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
            icon={<ChefHat className="w-4 h-4" />}
          />
          <MetaChip
            label="Cost"
            value={recipe.estimatedCost.charAt(0).toUpperCase() + recipe.estimatedCost.slice(1)}
            icon={<DollarSign className="w-4 h-4" />}
          />
        </div>

        {/* Ingredients */}
        <section className="mb-6">
          <h2 className="mb-3 text-base font-normal font-display text-foreground">
            Ingredients
          </h2>
          <ul className="space-y-2" data-testid="ingredients-list">
            {recipe.ingredients.map((ing, index) => (
              <li
                key={index}
                className="flex items-center gap-3 text-base text-muted-foreground"
              >
                <span className="w-5 h-5 rounded border border-border flex-shrink-0" aria-hidden="true" />
                <span>
                  {ing.quantity} {ing.unit} {ing.name}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Instructions */}
        <section>
          <h2 className="mb-3 text-base font-normal font-display text-foreground">
            Instructions
          </h2>
          <ol className="space-y-4" data-testid="instructions-list">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-primary text-primary-foreground text-sm font-semibold">
                  {index + 1}
                </span>
                <p className="text-base text-muted-foreground">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
