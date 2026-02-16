import { describe, it, expect } from 'vitest';
import { parseIngredientString, categorizeIngredient, parseIngredient } from '../ingredientParser';

// ---------------------------------------------------------------------------
// parseIngredientString
// ---------------------------------------------------------------------------

describe('parseIngredientString', () => {
  describe('unicode fractions', () => {
    it('parses ½ as 0.5', () => {
      // Arrange
      const raw = '½ cup milk';
      // Act
      const result = parseIngredientString(raw);
      // Assert
      expect(result.quantity).toBe(0.5);
      expect(result.unit).toBe('cup');
      expect(result.name).toBe('Milk');
    });

    it('parses ¼ as 0.25', () => {
      const result = parseIngredientString('¼ tsp salt');
      expect(result.quantity).toBe(0.25);
      expect(result.unit).toBe('tsp');
      expect(result.name).toBe('Salt');
    });

    it('parses ¾ as 0.75', () => {
      const result = parseIngredientString('¾ cup flour');
      expect(result.quantity).toBe(0.75);
      expect(result.unit).toBe('cup');
    });

    it('parses ⅓ as approximately 0.333', () => {
      const result = parseIngredientString('⅓ cup sugar');
      expect(result.quantity).toBeCloseTo(1 / 3);
    });

    it('parses ⅔ as approximately 0.667', () => {
      const result = parseIngredientString('⅔ cup cream');
      expect(result.quantity).toBeCloseTo(2 / 3);
    });

    it('parses ⅛ as 0.125', () => {
      const result = parseIngredientString('⅛ tsp pepper');
      expect(result.quantity).toBe(0.125);
    });

    it('parses ⅜ as 0.375', () => {
      const result = parseIngredientString('⅜ tsp spice');
      expect(result.quantity).toBe(0.375);
    });

    it('parses ⅝ as 0.625', () => {
      const result = parseIngredientString('⅝ cup broth');
      expect(result.quantity).toBe(0.625);
    });

    it('parses ⅞ as 0.875', () => {
      const result = parseIngredientString('⅞ cup water');
      expect(result.quantity).toBe(0.875);
    });
  });

  describe('mixed fractions', () => {
    it('parses "1 1/2" as 1.5', () => {
      const result = parseIngredientString('1 1/2 cups water');
      expect(result.quantity).toBe(1.5);
      expect(result.unit).toBe('cups');
    });

    it('parses "2 1/4" as 2.25', () => {
      const result = parseIngredientString('2 1/4 cups broth');
      expect(result.quantity).toBe(2.25);
    });

    it('parses "1½ cups" (whole + unicode fraction)', () => {
      const result = parseIngredientString('1½ cups stock');
      expect(result.quantity).toBe(1.5);
    });
  });

  describe('plain fractions', () => {
    it('parses "1/2" as 0.5', () => {
      const result = parseIngredientString('1/2 tsp vanilla');
      expect(result.quantity).toBe(0.5);
    });

    it('parses "3/4" as 0.75', () => {
      const result = parseIngredientString('3/4 cup flour');
      expect(result.quantity).toBe(0.75);
    });
  });

  describe('unit normalization', () => {
    it('normalises tablespoon variants', () => {
      const tbsp = parseIngredientString('2 tbsp olive oil');
      const tablespoon = parseIngredientString('2 tablespoons olive oil');
      expect(tbsp.unit).toBe('tbsp');
      expect(tablespoon.unit).toBe('tablespoons');
    });

    it('normalises teaspoon variants', () => {
      const tsp = parseIngredientString('1 tsp salt');
      expect(tsp.unit).toBe('tsp');
    });

    it('parses grams', () => {
      const result = parseIngredientString('200 g chicken');
      expect(result.unit).toBe('g');
      expect(result.quantity).toBe(200);
    });

    it('parses kilograms', () => {
      const result = parseIngredientString('1.5 kg beef');
      expect(result.quantity).toBe(1.5);
      expect(result.unit).toBe('kg');
    });

    it('parses ounces', () => {
      const result = parseIngredientString('4 oz cheese');
      expect(result.unit).toBe('oz');
    });

    it('parses pounds (lbs)', () => {
      const result = parseIngredientString('2 lbs chicken thighs');
      expect(result.unit).toBe('lbs');
      expect(result.quantity).toBe(2);
    });
  });

  describe('name cleaning', () => {
    it('removes parenthetical notes from name', () => {
      const result = parseIngredientString('2 cloves garlic (minced)');
      expect(result.name).not.toContain('(');
      expect(result.name).not.toContain(')');
      expect(result.name.toLowerCase()).toContain('garlic');
    });

    it('removes trailing comma content', () => {
      const result = parseIngredientString('2 cups flour, sifted');
      expect(result.name).toBe('Flour');
    });

    it('removes leading "of"', () => {
      const result = parseIngredientString('1 cup of milk');
      expect(result.name).toBe('Milk');
    });

    it('capitalises first letter of name', () => {
      const result = parseIngredientString('2 tbsp olive oil');
      expect(result.name.charAt(0)).toBe(result.name.charAt(0).toUpperCase());
    });
  });

  describe('edge cases', () => {
    it('returns quantity 1 for ingredient with no quantity', () => {
      const result = parseIngredientString('chicken breast');
      expect(result.quantity).toBe(1);
    });

    it('returns empty string unit when no unit present', () => {
      const result = parseIngredientString('2 eggs');
      expect(result.unit).toBe('');
    });

    it('handles empty string without throwing', () => {
      const result = parseIngredientString('');
      expect(result.name).toBe('');
    });

    it('parses decimal quantities like 0.5', () => {
      const result = parseIngredientString('0.5 cup sugar');
      expect(result.quantity).toBe(0.5);
    });

    it('returns "uncategorized" as default category', () => {
      const result = parseIngredientString('2 cups mystery ingredient');
      expect(result.category).toBe('uncategorized');
    });
  });
});

// ---------------------------------------------------------------------------
// categorizeIngredient
// ---------------------------------------------------------------------------

describe('categorizeIngredient', () => {
  it('categorises tomato as produce', () => {
    expect(categorizeIngredient('Tomato')).toBe('produce');
  });

  it('categorises garlic as produce', () => {
    expect(categorizeIngredient('garlic cloves')).toBe('produce');
  });

  it('categorises spinach as produce', () => {
    expect(categorizeIngredient('fresh spinach')).toBe('produce');
  });

  it('categorises milk as dairy', () => {
    expect(categorizeIngredient('whole milk')).toBe('dairy');
  });

  it('categorises butter as dairy', () => {
    expect(categorizeIngredient('Butter')).toBe('dairy');
  });

  it('categorises parmesan as dairy', () => {
    expect(categorizeIngredient('parmesan cheese')).toBe('dairy');
  });

  it('categorises chicken as meat', () => {
    expect(categorizeIngredient('chicken breast')).toBe('meat');
  });

  it('categorises salmon as meat', () => {
    expect(categorizeIngredient('salmon fillet')).toBe('meat');
  });

  it('categorises shrimp as meat', () => {
    expect(categorizeIngredient('Shrimp')).toBe('meat');
  });

  it('categorises frozen peas as produce (peas keyword matches first)', () => {
    expect(categorizeIngredient('frozen peas')).toBe('produce');
  });

  it('categorises ice cream as dairy (cream keyword matches first)', () => {
    expect(categorizeIngredient('ice cream')).toBe('dairy');
  });

  it('categorises frozen berries as frozen when no earlier category matches', () => {
    expect(categorizeIngredient('frozen nuggets')).toBe('frozen');
  });

  it('categorises flour as pantry', () => {
    expect(categorizeIngredient('plain flour')).toBe('pantry');
  });

  it('categorises olive oil as pantry', () => {
    expect(categorizeIngredient('olive oil')).toBe('pantry');
  });

  it('categorises pasta as pantry', () => {
    expect(categorizeIngredient('pasta')).toBe('pantry');
  });

  it('returns uncategorized for unknown ingredient', () => {
    expect(categorizeIngredient('xylophonium extract')).toBe('uncategorized');
  });

  it('is case-insensitive', () => {
    expect(categorizeIngredient('CHICKEN')).toBe('meat');
    expect(categorizeIngredient('MILK')).toBe('dairy');
  });
});

// ---------------------------------------------------------------------------
// parseIngredient (end-to-end integration)
// ---------------------------------------------------------------------------

describe('parseIngredient', () => {
  it('parses and categorises "2 cups milk"', () => {
    // Arrange
    const raw = '2 cups milk';
    // Act
    const result = parseIngredient(raw);
    // Assert
    expect(result.quantity).toBe(2);
    expect(result.unit).toBe('cups');
    expect(result.name).toBe('Milk');
    expect(result.category).toBe('dairy');
  });

  it('parses and categorises "3 chicken thighs"', () => {
    const result = parseIngredient('3 chicken thighs');
    expect(result.quantity).toBe(3);
    expect(result.name.toLowerCase()).toContain('chicken');
    expect(result.category).toBe('meat');
  });

  it('parses and categorises "½ cup olive oil"', () => {
    const result = parseIngredient('½ cup olive oil');
    expect(result.quantity).toBe(0.5);
    expect(result.unit).toBe('cup');
    expect(result.category).toBe('pantry');
  });

  it('parses and categorises "200 g frozen berries"', () => {
    const result = parseIngredient('200 g frozen berries');
    expect(result.quantity).toBe(200);
    expect(result.category).toBe('frozen');
  });

  it('returns uncategorized category for unknown ingredient', () => {
    const result = parseIngredient('1 handful mystery herb');
    expect(result.category).toBe('uncategorized');
  });
});
