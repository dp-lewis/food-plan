import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { recipes } from '../src/data/recipes';

// ---------------------------------------------------------------------------
// Load .env.local manually — no dotenv dependency required
// ---------------------------------------------------------------------------
function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), '.env.local');
  let raw: string;
  try {
    raw = readFileSync(envPath, 'utf-8');
  } catch {
    // .env.local is optional; env vars may already be set in the environment
    return;
  }

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    // Skip blank lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    // Strip optional surrounding quotes from the value
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Don't override values already set in the environment
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

// ---------------------------------------------------------------------------
// Validate required environment variables
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not set.');
  process.exit(1);
}
if (!serviceRoleKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is not set.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Create Supabase client with the service role key to bypass RLS
// ---------------------------------------------------------------------------
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ---------------------------------------------------------------------------
// Map camelCase Recipe fields to snake_case DB columns
// ---------------------------------------------------------------------------
function mapRecipeToRow(recipe: (typeof recipes)[number]) {
  const { mealType, prepTime, cookTime, estimatedCost, sourceUrl, sourceName, isUserRecipe, ...rest } = recipe;

  return {
    ...rest,
    meal_type: mealType,
    prep_time: prepTime,
    cook_time: cookTime,
    estimated_cost: estimatedCost,
    source_url: sourceUrl ?? null,
    source_name: sourceName ?? null,
    user_id: null,
    // isUserRecipe is not a DB column — intentionally omitted
  };
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
async function seed(): Promise<void> {
  console.log(`Seeding ${recipes.length} built-in recipes...`);

  const rows = recipes.map(mapRecipeToRow);

  const { data, error } = await supabase
    .from('recipes')
    .upsert(rows, { onConflict: 'id' })
    .select('id');

  if (error) {
    console.error('Upsert failed:', error.message);
    console.error('Details:', error.details);
    process.exit(1);
  }

  const upsertedCount = data?.length ?? 0;
  console.log(`Done. ${upsertedCount} recipe(s) upserted successfully.`);
}

seed();
