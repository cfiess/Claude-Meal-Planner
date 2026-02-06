import { useState, useRef, useEffect } from 'react';
import type { DayOfWeek, DayPlan, Recipe } from '../types';
import { useMealPlanner } from '../context/MealPlannerContext';
import { isValidUrl } from '../utils/helpers';

interface DayCardProps {
  day: DayOfWeek;
  label: string;
  date: string;
  plan: DayPlan;
  week: 'current' | 'next';
}

export function DayCard({ day, label, date, plan, week }: DayCardProps) {
  const { state, setDayDinner, setDayLunch, getRecipeById, updateRecipe } = useMealPlanner();

  const [dinnerInput, setDinnerInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [notesInput, setNotesInput] = useState(plan.dinner.notes || '');
  const [showNotes, setShowNotes] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current dinner display
  const currentRecipe = plan.dinner.recipeId
    ? getRecipeById(plan.dinner.recipeId)
    : undefined;
  const dinnerDisplay =
    currentRecipe?.name || plan.dinner.customMealName || '';
  const dinnerLink = currentRecipe?.link || plan.dinner.customLink;

  // Sort recipes by times cooked for dropdown
  const sortedRecipes = [...state.recipes].sort((a, b) => {
    if (b.timesCooked !== a.timesCooked) {
      return b.timesCooked - a.timesCooked;
    }
    return a.name.localeCompare(b.name);
  });

  // Filter recipes based on input
  const filteredRecipes = sortedRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(dinnerInput.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRecipe = (recipe: Recipe) => {
    setDayDinner(day, {
      recipeId: recipe.id,
      customMealName: undefined,
      customLink: undefined,
      notes: plan.dinner.notes,
    }, week);
    setDinnerInput('');
    setShowDropdown(false);
  };

  const handleCustomMeal = () => {
    if (!dinnerInput.trim()) return;

    // Check if input is a URL
    if (isValidUrl(dinnerInput)) {
      setDayDinner(day, {
        recipeId: undefined,
        customMealName: plan.dinner.customMealName || 'Linked Recipe',
        customLink: dinnerInput,
        notes: plan.dinner.notes,
      }, week);
    } else {
      setDayDinner(day, {
        recipeId: undefined,
        customMealName: dinnerInput,
        customLink: plan.dinner.customLink,
        notes: plan.dinner.notes,
      }, week);
    }
    setDinnerInput('');
    setShowDropdown(false);
  };

  const handleClearDinner = () => {
    setDayDinner(day, {}, week);
    setNotesInput('');
  };

  const handleNotesBlur = () => {
    if (notesInput !== plan.dinner.notes) {
      // Update the day's dinner notes
      setDayDinner(day, {
        ...plan.dinner,
        notes: notesInput || undefined,
      }, week);

      // Also save notes to the recipe if there's a linked recipe
      if (currentRecipe && notesInput.trim()) {
        updateRecipe({
          ...currentRecipe,
          notes: notesInput.trim(),
        });
      }
    }
  };

  const handleAddLink = () => {
    const link = prompt('Enter recipe URL:');
    if (link && isValidUrl(link)) {
      setDayDinner(day, {
        ...plan.dinner,
        customLink: link,
      }, week);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
      {/* Header */}
      <div className="mb-2 sm:mb-3">
        <h3 className="font-semibold text-gray-800">{label}</h3>
        <p className="text-xs sm:text-sm text-gray-500">{date}</p>
      </div>

      {/* Dinner Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Dinner
        </label>

        {dinnerDisplay ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-blue-50 rounded-md p-2">
              <span className="font-medium text-gray-800">{dinnerDisplay}</span>
              <button
                onClick={handleClearDinner}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Link */}
            {dinnerLink ? (
              <a
                href={dinnerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View Recipe
              </a>
            ) : (
              <button
                onClick={handleAddLink}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                +Add Link
              </button>
            )}

            {/* Notes */}
            {(plan.dinner.notes || showNotes) && (
              <textarea
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                onBlur={handleNotesBlur}
                placeholder="Add notes..."
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 mt-2"
                rows={2}
              />
            )}
            {!plan.dinner.notes && !showNotes && (
              <button
                onClick={() => setShowNotes(true)}
                className="block text-sm text-gray-500 hover:text-gray-700 mt-2"
              >
                +Add Notes
              </button>
            )}
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <input
                type="text"
                value={dinnerInput}
                onChange={e => {
                  setDinnerInput(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleCustomMeal();
                  }
                }}
                placeholder="Type or select meal..."
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {sortedRecipes.length > 0 && (
                  <div className="px-3 py-1 text-xs text-gray-400 bg-gray-50 border-b">
                    Your Recipes
                  </div>
                )}
                {filteredRecipes.length > 0 ? (
                  filteredRecipes.map(recipe => (
                    <button
                      key={recipe.id}
                      onClick={() => handleSelectRecipe(recipe)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex justify-between items-center"
                    >
                      <span>{recipe.name}</span>
                      <span className="text-gray-400 text-xs">
                        {recipe.timesCooked}x
                      </span>
                    </button>
                  ))
                ) : sortedRecipes.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No recipes yet. Add some in Recipe Book.
                  </div>
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No matching recipes.
                  </div>
                )}
                {dinnerInput.trim() && (
                  <button
                    onClick={handleCustomMeal}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 border-t border-gray-100"
                  >
                    <span className="text-gray-500">Add custom:</span>{' '}
                    <span className="font-medium text-blue-600">{dinnerInput}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lunch Section */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Lunch
        </label>
        <input
          type="text"
          value={plan.lunch}
          onChange={e => setDayLunch(day, e.target.value, week)}
          placeholder="Leftovers, sandwiches..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
