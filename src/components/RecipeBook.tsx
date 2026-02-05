import { useState } from 'react';
import { useMealPlanner } from '../context/MealPlannerContext';
import type { Recipe } from '../types';
import { RecipeForm } from './RecipeForm';
import { RecipeDetail } from './RecipeDetail';

export function RecipeBook() {
  const { state } = useMealPlanner();
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Sort recipes by times cooked (frequency) and then by name
  const sortedRecipes = [...state.recipes].sort((a, b) => {
    if (b.timesCooked !== a.timesCooked) {
      return b.timesCooked - a.timesCooked;
    }
    return a.name.localeCompare(b.name);
  });

  // Filter recipes
  const filteredRecipes = sortedRecipes.filter(recipe => {
    const matchesSearch = recipe.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesTag = !filterTag || recipe.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRecipe(undefined);
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Recipe Book</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base"
        >
          + Add Recipe
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterTag || ''}
          onChange={e => setFilterTag(e.target.value || null)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Tags</option>
          {state.availableTags.map(tag => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {state.recipes.length === 0
            ? 'No recipes yet. Add your first recipe to get started!'
            : 'No recipes match your search.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map(recipe => (
            <div
              key={recipe.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setViewingRecipe(recipe)}
            >
              <h3 className="font-semibold text-gray-800 mb-2">{recipe.name}</h3>

              {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {recipe.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {recipe.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{recipe.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {recipe.link && (
                    <span className="inline-flex items-center mr-2">
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
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      Link
                    </span>
                  )}
                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <span>{recipe.ingredients.length} ingredients</span>
                  )}
                </span>
                <span>Made {recipe.timesCooked}x</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Form Modal */}
      {showForm && (
        <RecipeForm existingRecipe={editingRecipe} onClose={handleCloseForm} />
      )}

      {/* Recipe Detail Modal */}
      {viewingRecipe && (
        <RecipeDetail
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(undefined)}
          onEdit={() => {
            setViewingRecipe(undefined);
            handleEdit(viewingRecipe);
          }}
        />
      )}
    </div>
  );
}
