export interface ParsedRecipe {
  title: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients: string[];
  instructions: string[];
  sourceUrl: string;
  sourceName?: string;
}

/**
 * Parse ISO 8601 duration (PT30M, PT1H30M) to minutes
 */
function parseDuration(duration: string | undefined): number | undefined {
  if (!duration) return undefined;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return undefined;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  return hours * 60 + minutes;
}

/**
 * Extract domain name from URL for source attribution
 */
function extractSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    // Remove www. prefix and common TLDs
    return hostname
      .replace(/^www\./, '')
      .replace(/\.(com|co\.uk|org|net)$/, '')
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  } catch {
    return 'Unknown Source';
  }
}

/**
 * Parse instructions from various formats
 */
function parseInstructions(instructions: unknown): string[] {
  if (!instructions) return [];

  // Array of strings
  if (Array.isArray(instructions)) {
    return instructions.flatMap((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        // HowToStep or HowToSection
        if ('text' in item && typeof item.text === 'string') return item.text;
        if ('itemListElement' in item && Array.isArray(item.itemListElement)) {
          return parseInstructions(item.itemListElement);
        }
      }
      return [];
    });
  }

  // Single string
  if (typeof instructions === 'string') {
    return instructions.split('\n').filter((s) => s.trim());
  }

  return [];
}

/**
 * Parse ingredients from various formats
 */
function parseIngredients(ingredients: unknown): string[] {
  if (!ingredients) return [];

  if (Array.isArray(ingredients)) {
    return ingredients
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'name' in item) {
          return String(item.name);
        }
        return null;
      })
      .filter((item): item is string => item !== null);
  }

  return [];
}

/**
 * Parse servings from various formats
 */
function parseServings(yield_: unknown): number | undefined {
  if (typeof yield_ === 'number') return yield_;
  if (typeof yield_ === 'string') {
    const match = yield_.match(/(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  if (Array.isArray(yield_) && yield_.length > 0) {
    return parseServings(yield_[0]);
  }
  return undefined;
}

/**
 * Extract Recipe schema from JSON-LD data
 */
export function extractRecipeFromJsonLd(
  jsonLdData: unknown,
  sourceUrl: string
): ParsedRecipe | null {
  if (!jsonLdData || typeof jsonLdData !== 'object') return null;

  // Handle @graph array
  if ('@graph' in jsonLdData && Array.isArray((jsonLdData as { '@graph': unknown[] })['@graph'])) {
    const graph = (jsonLdData as { '@graph': unknown[] })['@graph'];
    for (const item of graph) {
      const result = extractRecipeFromJsonLd(item, sourceUrl);
      if (result) return result;
    }
    return null;
  }

  // Handle array of schemas
  if (Array.isArray(jsonLdData)) {
    for (const item of jsonLdData) {
      const result = extractRecipeFromJsonLd(item, sourceUrl);
      if (result) return result;
    }
    return null;
  }

  const data = jsonLdData as Record<string, unknown>;

  // Check if this is a Recipe
  const type = data['@type'];
  const isRecipe =
    type === 'Recipe' ||
    (Array.isArray(type) && type.includes('Recipe'));

  if (!isRecipe) return null;

  const title = typeof data.name === 'string' ? data.name : undefined;
  if (!title) return null;

  return {
    title,
    description: typeof data.description === 'string' ? data.description : undefined,
    prepTime: parseDuration(data.prepTime as string | undefined),
    cookTime: parseDuration(data.cookTime as string | undefined),
    servings: parseServings(data.recipeYield),
    ingredients: parseIngredients(data.recipeIngredient),
    instructions: parseInstructions(data.recipeInstructions),
    sourceUrl,
    sourceName: extractSourceName(sourceUrl),
  };
}

/**
 * Parse recipe from HTML content
 */
export function parseRecipeFromHtml(html: string, sourceUrl: string): ParsedRecipe | null {
  // Find all JSON-LD script tags
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonContent = match[1].trim();
      const data = JSON.parse(jsonContent);
      const recipe = extractRecipeFromJsonLd(data, sourceUrl);
      if (recipe) return recipe;
    } catch {
      // Continue to next script tag if parsing fails
    }
  }

  return null;
}
