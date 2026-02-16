import { describe, it, expect } from 'vitest';
import { extractRecipeFromJsonLd, parseRecipeFromHtml } from '../recipeParser';
import type { ParsedRecipe } from '../recipeParser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRecipeJsonLd(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: 'Test Recipe',
    description: 'A simple test recipe.',
    prepTime: 'PT15M',
    cookTime: 'PT30M',
    recipeYield: '4 servings',
    recipeIngredient: ['2 cups flour', '1 egg'],
    recipeInstructions: [
      { '@type': 'HowToStep', text: 'Mix ingredients.' },
      { '@type': 'HowToStep', text: 'Bake at 180°C.' },
    ],
    ...overrides,
  };
}

const SOURCE_URL = 'https://www.example.com/recipes/test';

// ---------------------------------------------------------------------------
// extractRecipeFromJsonLd
// ---------------------------------------------------------------------------

describe('extractRecipeFromJsonLd', () => {
  it('extracts title, description, prepTime and cookTime', () => {
    // Arrange
    const data = makeRecipeJsonLd();
    // Act
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    // Assert
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Test Recipe');
    expect(result!.description).toBe('A simple test recipe.');
    expect(result!.prepTime).toBe(15);
    expect(result!.cookTime).toBe(30);
  });

  it('parses ISO 8601 duration: PT1H30M', () => {
    const data = makeRecipeJsonLd({ prepTime: 'PT1H30M' });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result!.prepTime).toBe(90);
  });

  it('parses ISO 8601 duration: PT2H', () => {
    const data = makeRecipeJsonLd({ cookTime: 'PT2H' });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result!.cookTime).toBe(120);
  });

  it('parses ISO 8601 duration: PT45M', () => {
    const data = makeRecipeJsonLd({ prepTime: 'PT45M' });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result!.prepTime).toBe(45);
  });

  it('returns undefined prepTime when field is missing', () => {
    const data = makeRecipeJsonLd({ prepTime: undefined });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result!.prepTime).toBeUndefined();
  });

  it('parses servings from string "4 servings"', () => {
    const result = extractRecipeFromJsonLd(makeRecipeJsonLd(), SOURCE_URL);
    expect(result!.servings).toBe(4);
  });

  it('parses servings from number', () => {
    const data = makeRecipeJsonLd({ recipeYield: 6 });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result!.servings).toBe(6);
  });

  it('parses servings from an array (takes first element)', () => {
    const data = makeRecipeJsonLd({ recipeYield: ['4 servings', '8 if halved'] });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result!.servings).toBe(4);
  });

  it('parses ingredients from string array', () => {
    const result = extractRecipeFromJsonLd(makeRecipeJsonLd(), SOURCE_URL);
    expect(result!.ingredients).toEqual(['2 cups flour', '1 egg']);
  });

  it('parses instructions from HowToStep array', () => {
    const result = extractRecipeFromJsonLd(makeRecipeJsonLd(), SOURCE_URL);
    expect(result!.instructions).toContain('Mix ingredients.');
    expect(result!.instructions).toContain('Bake at 180°C.');
  });

  it('parses instructions from plain string array', () => {
    const data = makeRecipeJsonLd({ recipeInstructions: ['Step one.', 'Step two.'] });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result!.instructions).toEqual(['Step one.', 'Step two.']);
  });

  it('parses instructions from a newline-delimited string', () => {
    const data = makeRecipeJsonLd({ recipeInstructions: 'Step one.\nStep two.' });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result!.instructions).toEqual(['Step one.', 'Step two.']);
  });

  it('sets sourceUrl correctly', () => {
    const result = extractRecipeFromJsonLd(makeRecipeJsonLd(), SOURCE_URL);
    expect(result!.sourceUrl).toBe(SOURCE_URL);
  });

  it('derives sourceName from URL', () => {
    const result = extractRecipeFromJsonLd(makeRecipeJsonLd(), 'https://www.allrecipes.com/recipe/123');
    expect(result!.sourceName).toBe('Allrecipes');
  });

  it('handles @graph array by finding the Recipe node', () => {
    // Arrange
    const graphData = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: 'Example Site' },
        makeRecipeJsonLd(),
        { '@type': 'BreadcrumbList' },
      ],
    };
    // Act
    const result = extractRecipeFromJsonLd(graphData, SOURCE_URL);
    // Assert
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Test Recipe');
  });

  it('handles a top-level array of schemas', () => {
    const arrayData = [
      { '@type': 'WebSite', name: 'Example' },
      makeRecipeJsonLd(),
    ];
    const result = extractRecipeFromJsonLd(arrayData, SOURCE_URL);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Test Recipe');
  });

  it('returns null when @graph has no Recipe node', () => {
    const graphData = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: 'Example Site' },
        { '@type': 'BreadcrumbList' },
      ],
    };
    const result = extractRecipeFromJsonLd(graphData, SOURCE_URL);
    expect(result).toBeNull();
  });

  it('handles @type as an array containing "Recipe"', () => {
    const data = makeRecipeJsonLd({ '@type': ['Recipe', 'Thing'] });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Test Recipe');
  });

  it('returns null when @type is not Recipe', () => {
    const data = { '@type': 'WebSite', name: 'A Site' };
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result).toBeNull();
  });

  it('returns null when name is missing', () => {
    const data = makeRecipeJsonLd({ name: undefined });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result).toBeNull();
  });

  it('returns null for null input', () => {
    const result = extractRecipeFromJsonLd(null, SOURCE_URL);
    expect(result).toBeNull();
  });

  it('returns null for non-object input', () => {
    const result = extractRecipeFromJsonLd('string', SOURCE_URL);
    expect(result).toBeNull();
  });

  it('handles HowToSection instructions with nested itemListElement', () => {
    const data = makeRecipeJsonLd({
      recipeInstructions: [
        {
          '@type': 'HowToSection',
          name: 'Part 1',
          itemListElement: [
            { '@type': 'HowToStep', text: 'Nested step one.' },
            { '@type': 'HowToStep', text: 'Nested step two.' },
          ],
        },
      ],
    });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result!.instructions).toContain('Nested step one.');
    expect(result!.instructions).toContain('Nested step two.');
  });

  it('returns empty ingredients array when recipeIngredient is missing', () => {
    const data = makeRecipeJsonLd({ recipeIngredient: undefined });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result!.ingredients).toEqual([]);
  });

  it('returns empty instructions array when recipeInstructions is missing', () => {
    const data = makeRecipeJsonLd({ recipeInstructions: undefined });
    const result = extractRecipeFromJsonLd(data, SOURCE_URL);
    expect(result!.instructions).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// parseRecipeFromHtml
// ---------------------------------------------------------------------------

describe('parseRecipeFromHtml', () => {
  function buildHtml(jsonLdContent: string): string {
    return `<html><head>
      <script type="application/ld+json">${jsonLdContent}</script>
    </head><body></body></html>`;
  }

  it('extracts recipe from a single JSON-LD script tag', () => {
    // Arrange
    const html = buildHtml(JSON.stringify(makeRecipeJsonLd()));
    // Act
    const result = parseRecipeFromHtml(html, SOURCE_URL);
    // Assert
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Test Recipe');
  });

  it('extracts recipe from multiple JSON-LD script tags (picks the Recipe one)', () => {
    const html = `
      <script type="application/ld+json">{"@type":"WebSite","name":"Site"}</script>
      <script type="application/ld+json">${JSON.stringify(makeRecipeJsonLd())}</script>
    `;
    const result = parseRecipeFromHtml(html, SOURCE_URL);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Test Recipe');
  });

  it('returns null when no JSON-LD script tags are present', () => {
    const html = '<html><body><p>No structured data here.</p></body></html>';
    const result = parseRecipeFromHtml(html, SOURCE_URL);
    expect(result).toBeNull();
  });

  it('returns null when JSON-LD contains no Recipe', () => {
    const html = buildHtml(JSON.stringify({ '@type': 'WebSite', name: 'Site' }));
    const result = parseRecipeFromHtml(html, SOURCE_URL);
    expect(result).toBeNull();
  });

  it('skips malformed JSON and continues to next script tag', () => {
    const html = `
      <script type="application/ld+json">{ this is not valid json }</script>
      <script type="application/ld+json">${JSON.stringify(makeRecipeJsonLd())}</script>
    `;
    const result = parseRecipeFromHtml(html, SOURCE_URL);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Test Recipe');
  });

  it('returns null when all JSON-LD script tags contain malformed JSON', () => {
    const html = `
      <script type="application/ld+json">{ bad json 1 }</script>
      <script type="application/ld+json">{ bad json 2 }</script>
    `;
    const result = parseRecipeFromHtml(html, SOURCE_URL);
    expect(result).toBeNull();
  });

  it('handles script tag with single-quoted type attribute', () => {
    const html = `<script type='application/ld+json'>${JSON.stringify(makeRecipeJsonLd())}</script>`;
    const result = parseRecipeFromHtml(html, SOURCE_URL);
    expect(result).not.toBeNull();
  });

  it('extracts recipe from @graph inside JSON-LD', () => {
    const graphData = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', name: 'Example' },
        makeRecipeJsonLd(),
      ],
    };
    const html = buildHtml(JSON.stringify(graphData));
    const result = parseRecipeFromHtml(html, SOURCE_URL);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Test Recipe');
  });
});
