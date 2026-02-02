import { Ingredient, IngredientCategory } from '@/types';

const UNITS = [
  // Volume
  'cups?', 'c\\.?',
  'tablespoons?', 'tbsp?\\.?', 'tbs\\.?',
  'teaspoons?', 'tsp?\\.?',
  'ml', 'milliliters?', 'millilitres?',
  'l', 'liters?', 'litres?',
  'fl\\.? ?oz\\.?', 'fluid ounces?',
  'pints?', 'pt\\.?',
  'quarts?', 'qt\\.?',
  'gallons?', 'gal\\.?',
  // Weight
  'grams?', 'g\\.?',
  'kilograms?', 'kg\\.?',
  'ounces?', 'oz\\.?',
  'pounds?', 'lbs?\\.?', 'lb\\.?',
  // Count/Other
  'pieces?', 'pcs?\\.?',
  'slices?',
  'cloves?',
  'cans?',
  'bunches?',
  'sprigs?',
  'stalks?',
  'heads?',
  'packages?', 'pkgs?\\.?',
  'pinch(?:es)?',
  'dash(?:es)?',
  'handfuls?',
  'small', 'medium', 'large',
];

const UNIT_PATTERN = new RegExp(`^(${UNITS.join('|')})\\b`, 'i');

// Fraction mapping
const FRACTION_MAP: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

/**
 * Parse a fraction string like "1/2" or "1 1/2" to a number
 */
function parseFraction(str: string): number | null {
  // Check for unicode fractions
  for (const [frac, value] of Object.entries(FRACTION_MAP)) {
    if (str.includes(frac)) {
      const parts = str.split(frac);
      const whole = parts[0].trim() ? parseFloat(parts[0]) : 0;
      return whole + value;
    }
  }

  // Check for text fractions like "1/2" or "1 1/2"
  const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const denom = parseInt(mixedMatch[3], 10);
    return whole + num / denom;
  }

  const fractionMatch = str.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const denom = parseInt(fractionMatch[2], 10);
    return num / denom;
  }

  const number = parseFloat(str);
  return isNaN(number) ? null : number;
}

/**
 * Parse an ingredient string like "2 lbs chicken thighs" into structured data
 */
export function parseIngredientString(raw: string): Omit<Ingredient, 'category'> & { category: IngredientCategory } {
  let text = raw.trim();

  // Extract quantity
  let quantity = 1;
  const quantityMatch = text.match(/^([\d\s\/½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞.,-]+)\s*/);
  if (quantityMatch) {
    const parsed = parseFraction(quantityMatch[1].trim().replace(',', '.'));
    if (parsed !== null) {
      quantity = parsed;
      text = text.slice(quantityMatch[0].length);
    }
  }

  // Extract unit
  let unit = '';
  const unitMatch = text.match(UNIT_PATTERN);
  if (unitMatch) {
    unit = unitMatch[1].toLowerCase();
    text = text.slice(unitMatch[0].length).trim();
  }

  // Clean up ingredient name
  let name = text
    .replace(/^of\s+/i, '') // Remove leading "of"
    .replace(/\s*\(.*?\)\s*/g, ' ') // Remove parentheticals
    .replace(/,.*$/, '') // Remove everything after comma
    .trim();

  // Capitalize first letter
  name = name.charAt(0).toUpperCase() + name.slice(1);

  return {
    name,
    quantity,
    unit,
    category: 'uncategorized',
  };
}

/**
 * Simple keyword-based category detection
 */
const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  produce: [
    'lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'celery',
    'potato', 'broccoli', 'spinach', 'kale', 'cucumber', 'zucchini',
    'mushroom', 'avocado', 'lemon', 'lime', 'orange', 'apple', 'banana',
    'berry', 'strawberry', 'blueberry', 'grape', 'herbs', 'basil', 'cilantro',
    'parsley', 'mint', 'thyme', 'rosemary', 'ginger', 'scallion', 'shallot',
    'cabbage', 'corn', 'peas', 'beans', 'asparagus', 'eggplant', 'squash',
  ],
  dairy: [
    'milk', 'cream', 'butter', 'cheese', 'yogurt', 'yoghurt', 'sour cream',
    'cottage cheese', 'ricotta', 'mozzarella', 'parmesan', 'cheddar',
    'cream cheese', 'half and half', 'half & half', 'whipping cream',
  ],
  meat: [
    'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'bacon', 'sausage',
    'ham', 'steak', 'ground', 'mince', 'fish', 'salmon', 'tuna', 'shrimp',
    'prawn', 'crab', 'lobster', 'scallop', 'mussels', 'clams', 'oyster',
    'meat', 'ribs', 'chops', 'thighs', 'breast', 'wings', 'drumsticks',
  ],
  frozen: [
    'frozen', 'ice cream', 'ice',
  ],
  pantry: [
    'flour', 'sugar', 'salt', 'pepper', 'oil', 'olive oil', 'vegetable oil',
    'vinegar', 'soy sauce', 'honey', 'maple syrup', 'vanilla', 'baking',
    'yeast', 'pasta', 'rice', 'noodles', 'bread', 'breadcrumbs', 'broth',
    'stock', 'can', 'canned', 'dried', 'spice', 'cumin', 'paprika', 'oregano',
    'cinnamon', 'nutmeg', 'curry', 'mustard', 'ketchup', 'mayonnaise', 'sauce',
    'cereal', 'oats', 'oatmeal', 'nuts', 'almonds', 'walnuts', 'peanut',
    'chocolate', 'cocoa', 'coffee', 'tea',
  ],
  uncategorized: [],
};

/**
 * Attempt to auto-categorize an ingredient by name
 */
export function categorizeIngredient(name: string): IngredientCategory {
  const lower = name.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [IngredientCategory, string[]][]) {
    if (category === 'uncategorized') continue;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }

  return 'uncategorized';
}

/**
 * Parse and categorize an ingredient string
 */
export function parseIngredient(raw: string): Ingredient {
  const parsed = parseIngredientString(raw);
  return {
    ...parsed,
    category: categorizeIngredient(parsed.name),
  };
}
