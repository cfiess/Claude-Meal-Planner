import { useState } from 'react';
import type { Recipe, Ingredient, GroceryCategory } from '../types';
import { useMealPlanner } from '../context/MealPlannerContext';
import { isValidUrl } from '../utils/helpers';
import { parseRecipeFromUrl, parseRecipeFromText } from '../utils/recipeParser';

interface RecipeFormProps {
  existingRecipe?: Recipe;
  onClose: () => void;
}

const GROCERY_CATEGORIES: GroceryCategory[] = [
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

export function RecipeForm({ existingRecipe, onClose }: RecipeFormProps) {
  const { addRecipe, updateRecipe, state, addTag } = useMealPlanner();

  const [name, setName] = useState(existingRecipe?.name || '');
  const [link, setLink] = useState(existingRecipe?.link || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    existingRecipe?.ingredients || []
  );
  const [steps, setSteps] = useState<string[]>(existingRecipe?.steps || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    existingRecipe?.tags || []
  );
  const [newTag, setNewTag] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [textParseError, setTextParseError] = useState('');

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: '', amount: '', unit: '', category: 'other' },
    ]);
  };

  const handleUpdateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleUpdateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddNewTag = () => {
    if (newTag.trim() && !state.availableTags.includes(newTag.trim())) {
      addTag(newTag.trim());
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleParseText = () => {
    if (!pastedText.trim()) {
      setTextParseError('Please paste some recipe text first');
      return;
    }

    setTextParseError('');

    const parsed = parseRecipeFromText(pastedText);
    if (parsed) {
      if (parsed.name && !name) setName(parsed.name);
      if (parsed.ingredients?.length) setIngredients(parsed.ingredients);
      if (parsed.steps?.length) setSteps(parsed.steps);
      setPastedText(''); // Clear after successful parse
    } else {
      setTextParseError(
        'Could not parse recipe from text. Try adding ingredients and steps manually below.'
      );
    }
  };

  const handleParseUrl = async () => {
    if (!link || !isValidUrl(link)) {
      setParseError('Please enter a valid URL');
      return;
    }

    setIsParsing(true);
    setParseError('');

    try {
      const parsed = await parseRecipeFromUrl(link);
      if (parsed) {
        if (parsed.name && !name) setName(parsed.name);
        if (parsed.ingredients?.length) setIngredients(parsed.ingredients);
        if (parsed.steps?.length) setSteps(parsed.steps);
      } else {
        setParseError(
          'Could not parse recipe from this URL. You can add the recipe details manually.'
        );
      }
    } catch {
      setParseError(
        'Could not parse recipe from this URL. You can add the recipe details manually.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const recipeData = {
      name: name.trim(),
      link: link.trim() || undefined,
      ingredients: ingredients.filter(i => i.name.trim()),
      steps: steps.filter(s => s.trim()),
      tags: selectedTags,
    };

    if (existingRecipe) {
      updateRecipe({
        ...existingRecipe,
        ...recipeData,
      });
    } else {
      addRecipe(recipeData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {existingRecipe ? 'Edit Recipe' : 'Add Recipe'}
          </h2>

          {/* Import from URL - only show for new recipes */}
          {!existingRecipe && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <label className="block text-sm font-medium text-green-800 mb-2">
                Import from URL
              </label>
              <p className="text-sm text-green-700 mb-2">
                Paste a recipe URL and we'll try to extract the ingredients and steps automatically.
              </p>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  className="flex-1 px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  placeholder="Paste recipe URL here..."
                />
                <button
                  type="button"
                  onClick={handleParseUrl}
                  disabled={isParsing || !link}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isParsing ? 'Importing...' : 'Import'}
                </button>
              </div>
              {parseError && (
                <p className="mt-2 text-sm text-amber-600">{parseError}</p>
              )}
            </div>
          )}

          {/* Paste Recipe Text - only show for new recipes */}
          {!existingRecipe && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <label className="block text-sm font-medium text-purple-800 mb-2">
                Paste Recipe Text
              </label>
              <p className="text-sm text-purple-700 mb-2">
                Copy a recipe from a cookbook, Google Doc, or anywhere else and paste it here.
              </p>
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white mb-2"
                placeholder="Paste your recipe here...&#10;&#10;Example:&#10;Ingredients:&#10;2 cups flour&#10;1 tsp salt&#10;&#10;Instructions:&#10;1. Mix ingredients..."
                rows={6}
              />
              <button
                type="button"
                onClick={handleParseText}
                disabled={!pastedText.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Parse Recipe
              </button>
              {textParseError && (
                <p className="mt-2 text-sm text-amber-600">{textParseError}</p>
              )}
            </div>
          )}

          {/* Divider for new recipes */}
          {!existingRecipe && (
            <div className="flex items-center mb-4">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-sm text-gray-500">or enter manually</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          )}

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipe Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mom's Famous Tacos"
              required
            />
          </div>

          {/* Link field - for editing or to show/modify the saved link */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipe Link {existingRecipe ? '' : '(saved from import or add your own)'}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={link}
                onChange={e => setLink(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
              {existingRecipe && (
                <button
                  type="button"
                  onClick={handleParseUrl}
                  disabled={isParsing || !link}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isParsing ? 'Parsing...' : 'Re-parse'}
                </button>
              )}
            </div>
            {existingRecipe && parseError && (
              <p className="mt-1 text-sm text-amber-600">{parseError}</p>
            )}
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {state.availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add new tag..."
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddNewTag}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Add Tag
              </button>
            </div>
          </div>

          {/* Ingredients */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ingredients (optional)
            </label>
            {ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={ingredient.amount}
                  onChange={e =>
                    handleUpdateIngredient(index, 'amount', e.target.value)
                  }
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  placeholder="Amt"
                />
                <input
                  type="text"
                  value={ingredient.unit}
                  onChange={e =>
                    handleUpdateIngredient(index, 'unit', e.target.value)
                  }
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  placeholder="Unit"
                />
                <input
                  type="text"
                  value={ingredient.name}
                  onChange={e =>
                    handleUpdateIngredient(index, 'name', e.target.value)
                  }
                  className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  placeholder="Ingredient name"
                />
                <select
                  value={ingredient.category}
                  onChange={e =>
                    handleUpdateIngredient(
                      index,
                      'category',
                      e.target.value as GroceryCategory
                    )
                  }
                  className="w-28 px-2 py-1 border border-gray-300 rounded-md text-sm"
                >
                  {GROCERY_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(index)}
                  className="px-2 py-1 text-red-600 hover:text-red-800"
                >
                  X
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddIngredient}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Ingredient
            </button>
          </div>

          {/* Steps */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Steps (optional)
            </label>
            {steps.map((step, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <span className="text-gray-500 py-1">{index + 1}.</span>
                <textarea
                  value={step}
                  onChange={e => handleUpdateStep(index, e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm resize-none"
                  rows={2}
                  placeholder="Describe this step..."
                />
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  className="px-2 py-1 text-red-600 hover:text-red-800"
                >
                  X
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddStep}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Step
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {existingRecipe ? 'Save Changes' : 'Add Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
