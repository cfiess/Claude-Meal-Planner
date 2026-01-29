import { useState, useEffect } from 'react';
import { useMealPlanner } from '../context/MealPlannerContext';
import type { Ingredient, GroceryCategory } from '../types';

interface AggregatedItem {
  name: string;
  amounts: string[];
  category: GroceryCategory;
  key: string;
}

const CATEGORY_ORDER: GroceryCategory[] = [
  'produce',
  'meat',
  'dairy',
  'bakery',
  'frozen',
  'pantry',
  'beverages',
  'condiments',
  'other',
];

const CATEGORY_LABELS: Record<GroceryCategory, string> = {
  produce: 'Produce',
  meat: 'Meat & Seafood',
  dairy: 'Dairy & Eggs',
  bakery: 'Bakery',
  frozen: 'Frozen',
  pantry: 'Pantry',
  beverages: 'Beverages',
  condiments: 'Condiments & Sauces',
  other: 'Other',
};

const CHECKED_STORAGE_KEY = 'shopping-list-checked';

export function ShoppingList() {
  const { state, getRecipeById } = useMealPlanner();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(CHECKED_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if it's from the current week
        if (parsed.weekStartDate === state.currentWeek.weekStartDate) {
          return new Set(parsed.items);
        }
      } catch {
        // Invalid data
      }
    }
    return new Set();
  });

  // Save checked items to localStorage
  useEffect(() => {
    localStorage.setItem(
      CHECKED_STORAGE_KEY,
      JSON.stringify({
        weekStartDate: state.currentWeek.weekStartDate,
        items: Array.from(checkedItems),
      })
    );
  }, [checkedItems, state.currentWeek.weekStartDate]);

  // Collect all ingredients from planned meals
  const allIngredients: Ingredient[] = [];

  Object.values(state.currentWeek.days).forEach(day => {
    if (day.dinner.recipeId) {
      const recipe = getRecipeById(day.dinner.recipeId);
      if (recipe?.ingredients) {
        allIngredients.push(...recipe.ingredients);
      }
    }
  });

  // Aggregate ingredients by name (case-insensitive)
  const aggregatedMap = new Map<string, AggregatedItem>();

  allIngredients.forEach(ingredient => {
    const normalizedName = ingredient.name.toLowerCase().trim();
    const existing = aggregatedMap.get(normalizedName);

    const amountStr = [ingredient.amount, ingredient.unit]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (existing) {
      if (amountStr && !existing.amounts.includes(amountStr)) {
        existing.amounts.push(amountStr);
      }
    } else {
      aggregatedMap.set(normalizedName, {
        name: ingredient.name,
        amounts: amountStr ? [amountStr] : [],
        category: ingredient.category,
        key: normalizedName,
      });
    }
  });

  // Group by category
  const groupedItems: Record<GroceryCategory, AggregatedItem[]> = {
    produce: [],
    meat: [],
    dairy: [],
    bakery: [],
    frozen: [],
    pantry: [],
    beverages: [],
    condiments: [],
    other: [],
  };

  aggregatedMap.forEach(item => {
    groupedItems[item.category].push(item);
  });

  // Sort items within each category alphabetically
  Object.values(groupedItems).forEach(items => {
    items.sort((a, b) => a.name.localeCompare(b.name));
  });

  const handleToggleItem = (key: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleClearChecked = () => {
    setCheckedItems(new Set());
  };

  const totalItems = aggregatedMap.size;
  const checkedCount = checkedItems.size;
  const hasItems = totalItems > 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Shopping List</h2>
          {hasItems && (
            <p className="text-gray-500">
              {checkedCount} of {totalItems} items checked
            </p>
          )}
        </div>
        {checkedCount > 0 && (
          <button
            onClick={handleClearChecked}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Checked
          </button>
        )}
      </div>

      {!hasItems ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No ingredients to shop for yet.</p>
          <p className="text-sm">
            Add meals with ingredients to your weekly plan to generate a shopping list.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORY_ORDER.map(category => {
            const items = groupedItems[category];
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-200">
                  {CATEGORY_LABELS[category]}
                </h3>
                <ul className="space-y-1">
                  {items.map(item => {
                    const isChecked = checkedItems.has(item.key);
                    return (
                      <li key={item.key}>
                        <label className="flex items-center gap-3 py-1 cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(item.key)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span
                            className={`flex-1 ${
                              isChecked ? 'line-through text-gray-400' : 'text-gray-700'
                            }`}
                          >
                            {item.name}
                            {item.amounts.length > 0 && (
                              <span className="text-gray-500 ml-2">
                                ({item.amounts.length > 1
                                  ? item.amounts.join(' + ')
                                  : item.amounts[0]}
                                {item.amounts.length > 1 && ` - ${item.amounts.length}x`})
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
