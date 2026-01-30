import { useState, useEffect } from 'react';
import { useMealPlanner } from '../context/MealPlannerContext';
import type { Ingredient } from '../types';

interface AggregatedItem {
  name: string;
  amounts: string[];
  category: string;
  key: string;
  isManual?: boolean;
}

const INITIAL_CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery',
  'Frozen',
  'Pantry',
  'Canned Goods',
  'Beverages',
  'Condiments & Sauces',
  'Other',
];

// Map old category keys to display names
const LEGACY_CATEGORY_MAP: Record<string, string> = {
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
const CATEGORY_OVERRIDES_KEY = 'shopping-list-category-overrides';
const CATEGORIES_KEY = 'shopping-list-categories';
const MANUAL_ITEMS_KEY = 'shopping-list-manual-items';

interface ManualItem {
  name: string;
  category: string;
  quantity?: string;
}

export function ShoppingList() {
  const { state, getRecipeById } = useMealPlanner();

  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(CHECKED_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.weekStartDate === state.currentWeek.weekStartDate) {
          return new Set(parsed.items);
        }
      } catch {
        // Invalid data
      }
    }
    return new Set();
  });

  // Category overrides: ingredient key -> category name
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>(() => {
    const stored = localStorage.getItem(CATEGORY_OVERRIDES_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Invalid data
      }
    }
    return {};
  });

  // All categories (user can add, rename, delete)
  const [categories, setCategories] = useState<string[]>(() => {
    const stored = localStorage.getItem(CATEGORIES_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Invalid data
      }
    }
    return INITIAL_CATEGORIES;
  });

  // Manual items (user-added, not from recipes)
  const [manualItems, setManualItems] = useState<ManualItem[]>(() => {
    const stored = localStorage.getItem(MANUAL_ITEMS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.weekStartDate === state.currentWeek.weekStartDate) {
          return parsed.items;
        }
      } catch {
        // Invalid data
      }
    }
    return [];
  });

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Other');

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(
      CHECKED_STORAGE_KEY,
      JSON.stringify({
        weekStartDate: state.currentWeek.weekStartDate,
        items: Array.from(checkedItems),
      })
    );
  }, [checkedItems, state.currentWeek.weekStartDate]);

  useEffect(() => {
    localStorage.setItem(CATEGORY_OVERRIDES_KEY, JSON.stringify(categoryOverrides));
  }, [categoryOverrides]);

  useEffect(() => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(
      MANUAL_ITEMS_KEY,
      JSON.stringify({
        weekStartDate: state.currentWeek.weekStartDate,
        items: manualItems,
      })
    );
  }, [manualItems, state.currentWeek.weekStartDate]);

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
      // Use override if exists, otherwise map legacy category to display name
      const baseCategory = LEGACY_CATEGORY_MAP[ingredient.category] || ingredient.category;
      let category = categoryOverrides[normalizedName] || baseCategory;

      // If category doesn't exist anymore, fall back to Other
      if (!categories.includes(category)) {
        category = 'Other';
      }

      aggregatedMap.set(normalizedName, {
        name: ingredient.name,
        amounts: amountStr ? [amountStr] : [],
        category,
        key: normalizedName,
      });
    }
  });

  // Add manual items to the map
  manualItems.forEach(item => {
    const normalizedName = item.name.toLowerCase().trim();
    const key = `manual-${normalizedName}`;

    // Don't add if already exists from recipes
    if (!aggregatedMap.has(normalizedName)) {
      let category = item.category;
      if (!categories.includes(category)) {
        category = 'Other';
      }

      aggregatedMap.set(key, {
        name: item.name,
        amounts: item.quantity ? [item.quantity] : [],
        category,
        key,
        isManual: true,
      });
    }
  });

  // Group by category
  const groupedItems: Record<string, AggregatedItem[]> = {};

  // Initialize all categories
  categories.forEach(cat => {
    groupedItems[cat] = [];
  });

  aggregatedMap.forEach(item => {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = [];
    }
    groupedItems[item.category].push(item);
  });

  // Sort items within each category alphabetically
  Object.values(groupedItems).forEach(items => {
    items.sort((a, b) => a.name.localeCompare(b.name));
  });

  // Get categories that have items, in order
  const categoriesWithItems = categories.filter(cat => groupedItems[cat]?.length > 0);

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

  const handleChangeCategory = (itemKey: string, newCategory: string) => {
    setCategoryOverrides(prev => ({
      ...prev,
      [itemKey]: newCategory,
    }));
    setEditingItem(null);
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories(prev => [...prev, trimmed]);
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const handleStartEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditingCategoryName(category);
  };

  const handleSaveCategory = () => {
    if (!editingCategory) return;

    const trimmed = editingCategoryName.trim();
    if (!trimmed) {
      setEditingCategory(null);
      return;
    }

    // If name changed
    if (trimmed !== editingCategory) {
      // Check if new name already exists
      if (categories.includes(trimmed)) {
        alert('A category with this name already exists');
        return;
      }

      // Update categories list
      setCategories(prev => prev.map(c => (c === editingCategory ? trimmed : c)));

      // Update all item overrides that reference the old category
      setCategoryOverrides(prev => {
        const updated = { ...prev };
        for (const key in updated) {
          if (updated[key] === editingCategory) {
            updated[key] = trimmed;
          }
        }
        return updated;
      });
    }

    setEditingCategory(null);
  };

  const handleDeleteCategory = (category: string) => {
    if (category === 'Other') {
      alert('Cannot delete the "Other" category');
      return;
    }

    if (!confirm(`Delete "${category}"? Items will be moved to "Other".`)) {
      return;
    }

    // Remove category
    setCategories(prev => prev.filter(c => c !== category));

    // Move items in this category to "Other"
    setCategoryOverrides(prev => {
      const updated = { ...prev };
      for (const key in updated) {
        if (updated[key] === category) {
          updated[key] = 'Other';
        }
      }
      return updated;
    });

    setEditingCategory(null);
  };

  const handleAddItem = () => {
    const trimmed = newItemName.trim();
    if (!trimmed) return;

    // Check if already exists
    const normalizedName = trimmed.toLowerCase();
    const alreadyExists = manualItems.some(
      item => item.name.toLowerCase() === normalizedName
    );

    if (!alreadyExists) {
      setManualItems(prev => [
        ...prev,
        { name: trimmed, category: newItemCategory, quantity: newItemQty.trim() || undefined },
      ]);
    }

    setNewItemName('');
    setNewItemQty('');
    setShowAddItem(false);
  };

  const handleRemoveManualItem = (itemName: string) => {
    setManualItems(prev =>
      prev.filter(item => item.name.toLowerCase() !== itemName.toLowerCase())
    );
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
        <div className="flex gap-2 flex-wrap justify-end">
          {showAddItem ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newItemQty}
                onChange={e => setNewItemQty(e.target.value)}
                placeholder="Qty"
                className="w-16 px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                placeholder="Item name..."
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddItem();
                  if (e.key === 'Escape') setShowAddItem(false);
                }}
                autoFocus
              />
              <select
                value={newItemCategory}
                onChange={e => setNewItemCategory(e.target.value)}
                className="px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddItem}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddItem(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddItem(true)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              +Add Item
            </button>
          )}
          {showAddCategory ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCategory();
                  if (e.key === 'Escape') setShowAddCategory(false);
                }}
                autoFocus
              />
              <button
                onClick={handleAddCategory}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddCategory(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCategory(true)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              +Add Category
            </button>
          )}
          {checkedCount > 0 && (
            <button
              onClick={handleClearChecked}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Checked
            </button>
          )}
        </div>
      </div>

      {!hasItems ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No items on your shopping list yet.</p>
          <p className="text-sm">
            Add meals with ingredients to your weekly plan, or click +Add Item to add items manually.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categoriesWithItems.map(category => {
            const items = groupedItems[category];
            const isEditingThisCategory = editingCategory === category;

            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200">
                  {isEditingThisCategory ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={e => setEditingCategoryName(e.target.value)}
                        className="font-semibold text-gray-700 px-2 py-1 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveCategory();
                          if (e.key === 'Escape') setEditingCategory(null);
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveCategory}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="text-xs px-2 py-1 text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-gray-700">{category}</h3>
                      <button
                        onClick={() => handleStartEditCategory(category)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
                <ul className="space-y-1">
                  {items.map(item => {
                    const isChecked = checkedItems.has(item.key);
                    const isEditing = editingItem === item.key;

                    return (
                      <li key={item.key} className="flex items-center gap-2">
                        <label className="flex items-center gap-3 py-1 cursor-pointer hover:bg-gray-50 rounded px-2 flex-1">
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

                        {isEditing ? (
                          <select
                            value={item.category}
                            onChange={e => handleChangeCategory(item.key, e.target.value)}
                            onBlur={() => setEditingItem(null)}
                            className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingItem(item.key)}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                            title="Change category"
                          >
                            Move
                          </button>
                        )}
                        {item.isManual && (
                          <button
                            onClick={() => handleRemoveManualItem(item.name)}
                            className="text-xs text-red-400 hover:text-red-600 px-1"
                            title="Remove item"
                          >
                            X
                          </button>
                        )}
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
