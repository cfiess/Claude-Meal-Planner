import { useState, useEffect } from 'react';
import { useMealPlanner } from '../context/MealPlannerContext';
import { useAuth } from '../context/AuthContext';
import { APP_VERSION } from '../version';

const CATEGORIES_KEY = 'shopping-list-categories';
const CATEGORY_OVERRIDES_KEY = 'shopping-list-category-overrides';
const SHOPPING_HISTORY_KEY = 'shopping-list-history';

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

export function Admin() {
  const { state, addTag, removeTag, updateTag } = useMealPlanner();
  const { household } = useAuth();

  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);
  const [activeSection, setActiveSection] = useState<'tags' | 'categories' | 'history' | 'analytics' | 'data' | 'household'>('analytics');
  const [copied, setCopied] = useState(false);

  // Shopping history (cumulative counts)
  const [shoppingHistory, setShoppingHistory] = useState<Record<string, number>>(() => {
    const stored = localStorage.getItem(SHOPPING_HISTORY_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  });

  // Save shopping history
  useEffect(() => {
    localStorage.setItem(SHOPPING_HISTORY_KEY, JSON.stringify(shoppingHistory));
  }, [shoppingHistory]);

  // Sort recipes by times cooked
  const sortedRecipes = [...state.recipes].sort((a, b) => b.timesCooked - a.timesCooked);

  // Sort shopping history by count
  const sortedShoppingHistory = Object.entries(shoppingHistory)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const handleStartEditTag = (tag: string) => {
    setEditingTag(tag);
    setEditingTagName(tag);
  };

  const handleSaveTag = () => {
    if (!editingTag) return;
    const trimmed = editingTagName.trim();
    if (trimmed && trimmed !== editingTag) {
      updateTag(editingTag, trimmed);
    }
    setEditingTag(null);
  };

  const handleDeleteTag = (tag: string) => {
    if (confirm(`Delete tag "${tag}"? It will be removed from all recipes.`)) {
      removeTag(tag);
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagName.trim();
    if (trimmed && !state.availableTags.includes(trimmed)) {
      addTag(trimmed);
      setNewTagName('');
      setShowAddTag(false);
    }
  };

  const handleResetCategories = () => {
    if (confirm('Reset shopping list categories to defaults? Custom categories will be removed.')) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(INITIAL_CATEGORIES));
      localStorage.removeItem(CATEGORY_OVERRIDES_KEY);
      alert('Categories reset. Refresh the page to see changes.');
    }
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure? This will delete ALL your data including recipes, meal plans, and history. This cannot be undone.')) {
      if (confirm('Really delete everything?')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const handleClearShoppingHistory = () => {
    if (confirm('Clear shopping history? This will reset all item counts to 0.')) {
      setShoppingHistory({});
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Settings & Analytics</h2>
        <span className="text-sm text-gray-400">v{APP_VERSION}</span>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setActiveSection('analytics')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeSection === 'analytics'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveSection('tags')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeSection === 'tags'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Manage Tags
        </button>
        <button
          onClick={() => setActiveSection('categories')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeSection === 'categories'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveSection('history')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeSection === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Week History
        </button>
        <button
          onClick={() => setActiveSection('data')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeSection === 'data'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Data Management
        </button>
        <button
          onClick={() => setActiveSection('household')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeSection === 'household'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Household
        </button>
      </div>

      {/* Analytics Section */}
      {activeSection === 'analytics' && (
        <div className="space-y-8">
          {/* Meal Analytics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Meal Frequency</h3>
            {sortedRecipes.length === 0 ? (
              <p className="text-gray-500">No meals tracked yet. Add recipes and plan meals to see stats.</p>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Meal</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Times Made</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRecipes.map(recipe => (
                      <tr key={recipe.id} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-gray-800">{recipe.name}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{recipe.timesCooked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Shopping Analytics */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Shopping History</h3>
              {sortedShoppingHistory.length > 0 && (
                <button
                  onClick={handleClearShoppingHistory}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear History
                </button>
              )}
            </div>
            {sortedShoppingHistory.length === 0 ? (
              <p className="text-gray-500">No shopping history yet. Items are tracked as you check them off.</p>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Item</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Times Bought</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedShoppingHistory.map(item => (
                      <tr key={item.name} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-gray-800">{item.name}</td>
                        <td className="px-4 py-2 text-right text-gray-600">{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags Section */}
      {activeSection === 'tags' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Recipe Tags</h3>
            {showAddTag ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="New tag..."
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') setShowAddTag(false);
                  }}
                  autoFocus
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddTag(false)}
                  className="px-3 py-1 text-sm text-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTag(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                +Add Tag
              </button>
            )}
          </div>

          {state.availableTags.length === 0 ? (
            <p className="text-gray-500">No tags yet.</p>
          ) : (
            <div className="space-y-2">
              {state.availableTags.map(tag => (
                <div
                  key={tag}
                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                >
                  {editingTag === tag ? (
                    <div className="flex gap-2 flex-1">
                      <input
                        type="text"
                        value={editingTagName}
                        onChange={e => setEditingTagName(e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded-md"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveTag();
                          if (e.key === 'Escape') setEditingTag(null);
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveTag}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTag(null)}
                        className="px-3 py-1 text-sm text-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-gray-800">{tag}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEditTag(tag)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categories Section */}
      {activeSection === 'categories' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Shopping List Categories</h3>
          <p className="text-gray-600 mb-4">
            You can edit categories directly in the Shopping List. Use this to reset to defaults if needed.
          </p>
          <button
            onClick={handleResetCategories}
            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
          >
            Reset Categories to Defaults
          </button>
        </div>
      )}

      {/* Week History Section */}
      {activeSection === 'history' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Past Weeks</h3>
          {state.weekHistory.length === 0 ? (
            <p className="text-gray-500">No past weeks yet. History is saved when a new week starts.</p>
          ) : (
            <div className="space-y-4">
              {state.weekHistory.map(week => (
                <div
                  key={week.id}
                  className="bg-white p-4 rounded-lg border border-gray-200"
                >
                  <h4 className="font-medium text-gray-800 mb-2">
                    Week of {new Date(week.weekStartDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {Object.entries(week.days).map(([day, plan]) => {
                      const dinnerName = plan.dinner.customMealName ||
                        (plan.dinner.recipeId ? state.recipes.find(r => r.id === plan.dinner.recipeId)?.name : null);
                      return (
                        <div key={day} className="text-gray-600">
                          <span className="font-medium capitalize">{day.slice(0, 3)}:</span>{' '}
                          {dinnerName || <span className="text-gray-400">-</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Data Management Section */}
      {activeSection === 'data' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Clear All Data</h3>
            <p className="text-gray-600 mb-4">
              This will permanently delete all your recipes, meal plans, shopping lists, and settings.
            </p>
            <button
              onClick={handleClearAllData}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete All Data
            </button>
          </div>
        </div>
      )}

      {/* Household Section */}
      {activeSection === 'household' && household && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Household Info</h3>
            <p className="text-gray-600 mb-4">
              <strong>Name:</strong> {household.name}
            </p>
            <p className="text-gray-600 mb-4">
              <strong>Members:</strong> {household.members.length} {household.members.length === 1 ? 'person' : 'people'}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Invite Someone</h3>
            <p className="text-gray-600 mb-4">
              Share this code with your partner so they can join your household:
            </p>
            <div className="flex gap-2 items-center">
              <code className="bg-gray-100 px-4 py-2 rounded-md text-sm font-mono flex-1 break-all">
                {household.id}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(household.id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              They'll need to sign in and paste this code to join.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
