import type { Ingredient, GroceryCategory } from '../types';

interface ParsedRecipe {
  name?: string;
  ingredients?: Ingredient[];
  steps?: string[];
}

// Common ingredient keywords to help categorize
const CATEGORY_KEYWORDS: Record<GroceryCategory, string[]> = {
  produce: [
    'lettuce', 'tomato', 'onion', 'garlic', 'pepper', 'carrot', 'celery',
    'potato', 'broccoli', 'spinach', 'kale', 'mushroom', 'zucchini', 'cucumber',
    'avocado', 'lemon', 'lime', 'orange', 'apple', 'banana', 'berry', 'herb',
    'cilantro', 'parsley', 'basil', 'ginger', 'jalapeño', 'cabbage', 'corn',
  ],
  meat: [
    'chicken', 'beef', 'pork', 'turkey', 'bacon', 'sausage', 'ham', 'steak',
    'ground', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster',
    'tilapia', 'cod', 'meat',
  ],
  dairy: [
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream', 'egg',
    'parmesan', 'mozzarella', 'cheddar', 'feta', 'ricotta',
  ],
  bakery: [
    'bread', 'bun', 'roll', 'tortilla', 'pita', 'naan', 'croissant', 'bagel',
  ],
  frozen: [
    'frozen', 'ice cream',
  ],
  pantry: [
    'flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'rice', 'pasta',
    'noodle', 'bean', 'lentil', 'chickpea', 'broth', 'stock', 'sauce',
    'tomato paste', 'can', 'canned', 'dried', 'spice', 'cumin', 'paprika',
    'oregano', 'thyme', 'cinnamon', 'vanilla', 'baking', 'yeast', 'oat',
    'cereal', 'honey', 'syrup', 'peanut butter', 'jam', 'nut',
  ],
  beverages: [
    'juice', 'soda', 'water', 'wine', 'beer', 'coffee', 'tea',
  ],
  condiments: [
    'ketchup', 'mustard', 'mayo', 'mayonnaise', 'relish', 'hot sauce',
    'soy sauce', 'worcestershire', 'bbq', 'salsa', 'dressing',
  ],
  other: [],
};

function guessCategory(ingredientName: string): GroceryCategory {
  const lowerName = ingredientName.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return category as GroceryCategory;
      }
    }
  }

  return 'other';
}

function parseIngredientString(str: string): Ingredient {
  // Try to extract amount, unit, and name from common formats
  // Examples: "2 cups flour", "1/2 tsp salt", "3 large eggs"
  const cleaned = str.trim();

  // Common units
  const units = [
    'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon',
    'teaspoons', 'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds',
    'g', 'gram', 'grams', 'kg', 'ml', 'liter', 'liters', 'quart', 'quarts',
    'pint', 'pints', 'gallon', 'gallons', 'can', 'cans', 'package', 'packages',
    'bunch', 'bunches', 'clove', 'cloves', 'slice', 'slices', 'piece', 'pieces',
  ];

  // Match amount at the start (handles fractions like 1/2, decimals, ranges like 1-2)
  const amountMatch = cleaned.match(/^([\d\s\/\-\.]+)/);
  let amount = '';
  let remaining = cleaned;

  if (amountMatch) {
    amount = amountMatch[1].trim();
    remaining = cleaned.slice(amountMatch[0].length).trim();
  }

  // Try to find a unit
  let unit = '';
  const lowerRemaining = remaining.toLowerCase();

  for (const u of units) {
    if (lowerRemaining.startsWith(u + ' ') || lowerRemaining.startsWith(u + 's ')) {
      const unitMatch = remaining.match(new RegExp(`^(${u}s?)\\s*`, 'i'));
      if (unitMatch) {
        unit = unitMatch[1];
        remaining = remaining.slice(unitMatch[0].length).trim();
        break;
      }
    }
  }

  // The rest is the ingredient name
  const name = remaining || str;

  return {
    name,
    amount,
    unit,
    category: guessCategory(name),
  };
}

export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe | null> {
  try {
    // Use a CORS proxy to fetch the page
    // In production, you'd want your own backend for this
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch URL');
    }

    const html = await response.text();

    // Try to find JSON-LD schema.org Recipe data
    const jsonLdMatch = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );

    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        const jsonContent = match.replace(
          /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i,
          ''
        ).replace(/<\/script>/i, '');

        try {
          const data = JSON.parse(jsonContent);

          // Handle @graph format
          const recipes = data['@graph']
            ? data['@graph'].filter((item: { '@type'?: string | string[] }) =>
                item['@type'] === 'Recipe' ||
                (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
              )
            : [data];

          const recipe = recipes.find(
            (item: { '@type'?: string | string[] }) =>
              item['@type'] === 'Recipe' ||
              (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
          );

          if (recipe) {
            const parsed: ParsedRecipe = {};

            if (recipe.name) {
              parsed.name = recipe.name;
            }

            if (recipe.recipeIngredient && Array.isArray(recipe.recipeIngredient)) {
              parsed.ingredients = recipe.recipeIngredient.map((ing: string) =>
                parseIngredientString(ing)
              );
            }

            if (recipe.recipeInstructions) {
              if (Array.isArray(recipe.recipeInstructions)) {
                parsed.steps = recipe.recipeInstructions.map(
                  (step: string | { text?: string; '@type'?: string }) => {
                    if (typeof step === 'string') return step;
                    if (step.text) return step.text;
                    return '';
                  }
                ).filter(Boolean);
              } else if (typeof recipe.recipeInstructions === 'string') {
                parsed.steps = recipe.recipeInstructions
                  .split(/\n+/)
                  .map((s: string) => s.trim())
                  .filter(Boolean);
              }
            }

            return parsed;
          }
        } catch {
          // Continue to next JSON-LD block
        }
      }
    }

    // Fallback: Try to parse from common HTML patterns
    // This is less reliable but can work for simpler sites

    return null;
  } catch (error) {
    console.error('Error parsing recipe:', error);
    return null;
  }
}

export function parseRecipeFromText(text: string): ParsedRecipe | null {
  if (!text.trim()) return null;

  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const parsed: ParsedRecipe = {};
  const ingredientLines: string[] = [];
  const stepLines: string[] = [];

  let currentSection: 'unknown' | 'ingredients' | 'instructions' = 'unknown';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Detect section headers
    if (lowerLine.includes('ingredient')) {
      currentSection = 'ingredients';
      continue;
    }
    if (
      lowerLine.includes('instruction') ||
      lowerLine.includes('direction') ||
      lowerLine.includes('method') ||
      lowerLine.includes('steps')
    ) {
      currentSection = 'instructions';
      continue;
    }

    // If first non-header line and no name yet, treat as recipe name
    if (!parsed.name && currentSection === 'unknown') {
      // Skip lines that look like ingredients or steps
      const looksLikeIngredient = /^\d|^[-•*]/.test(line);
      if (!looksLikeIngredient && line.length < 100) {
        parsed.name = line;
        continue;
      }
    }

    // Clean up list markers
    const cleanedLine = line
      .replace(/^[-•*]\s*/, '')
      .replace(/^\d+[.)]\s*/, '')
      .trim();

    if (!cleanedLine) continue;

    // Try to intelligently categorize if section is unknown
    if (currentSection === 'unknown') {
      // Lines starting with numbers/fractions followed by units are likely ingredients
      const looksLikeIngredient = /^[\d½¼¾⅓⅔⅛]/.test(cleanedLine) ||
        /^(one|two|three|four|five|six|a|an)\s/i.test(cleanedLine);
      // Longer lines with verbs are likely instructions
      const looksLikeStep = cleanedLine.length > 50 ||
        /^(preheat|mix|add|stir|cook|bake|heat|combine|pour|place|set|let|bring|cut|chop|slice)/i.test(cleanedLine);

      if (looksLikeIngredient && !looksLikeStep) {
        ingredientLines.push(cleanedLine);
      } else if (looksLikeStep) {
        stepLines.push(cleanedLine);
      } else if (ingredientLines.length > 0 && stepLines.length === 0) {
        // If we've started collecting ingredients, keep adding until we hit steps
        ingredientLines.push(cleanedLine);
      } else if (stepLines.length > 0) {
        stepLines.push(cleanedLine);
      }
    } else if (currentSection === 'ingredients') {
      ingredientLines.push(cleanedLine);
    } else if (currentSection === 'instructions') {
      stepLines.push(cleanedLine);
    }
  }

  if (ingredientLines.length > 0) {
    parsed.ingredients = ingredientLines.map(line => parseIngredientString(line));
  }

  if (stepLines.length > 0) {
    parsed.steps = stepLines;
  }

  // Only return if we parsed something useful
  if (parsed.name || parsed.ingredients?.length || parsed.steps?.length) {
    return parsed;
  }

  return null;
}
