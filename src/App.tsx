import { useState } from 'react';
import { MealPlannerProvider } from './context/MealPlannerContext';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { RecipeBook } from './components/RecipeBook';

type Tab = 'planner' | 'recipes';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('planner');

  return (
    <MealPlannerProvider>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-800">Meal Planner</h1>
              <nav className="flex gap-1">
                <button
                  onClick={() => setActiveTab('planner')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'planner'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Weekly Plan
                </button>
                <button
                  onClick={() => setActiveTab('recipes')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'recipes'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Recipe Book
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto">
          {activeTab === 'planner' && <WeeklyPlanner />}
          {activeTab === 'recipes' && <RecipeBook />}
        </main>
      </div>
    </MealPlannerProvider>
  );
}

export default App;
