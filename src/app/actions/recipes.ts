'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from '@/types';
import type { Recipe } from '@/types';
import {
  getUserRecipes,
  insertRecipe,
  deleteRecipe,
} from '@/lib/supabase/queries';

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user;
}

export async function loadUserRecipes(): Promise<ActionResult<Recipe[]>> {
  try {
    const user = await getAuthUser();
    const recipes = await getUserRecipes(user.id);
    return { data: recipes, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to load recipes' };
  }
}

export async function saveUserRecipe(recipe: Recipe): Promise<ActionResult<Recipe>> {
  try {
    const user = await getAuthUser();
    const result = await insertRecipe(recipe, user.id);
    return { data: result, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to save recipe' };
  }
}

export async function deleteUserRecipeAction(recipeId: string): Promise<ActionResult<void>> {
  try {
    await getAuthUser();
    await deleteRecipe(recipeId);
    return { data: undefined, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Failed to delete recipe' };
  }
}
