import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MealPlannerProvider, useMealPlanner } from './context/MealPlannerContext';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { RecipeBook } from './components/RecipeBook';
import { ShoppingList } from './components/ShoppingList';
import { Admin } from './components/Admin';
import { Login } from './components/Login';

type Tab = 'planner' | 'recipes' | 'shopping' | 'admin';

function MainApp() {
  const [activeTab, setActiveTab] = useState<Tab>('planner');
  const { user, household, signOut } = useAuth();
  const { loading } = useMealPlanner();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your meal plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Meal Planner</h1>
              {household && (
                <p className="text-xs text-gray-500">{household.name}</p>
              )}
            </div>
            <nav className="flex gap-1 items-center">
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
              <button
                onClick={() => setActiveTab('shopping')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'shopping'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Shopping List
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'admin'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Settings
              </button>
              {user && (
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                  {user.photoURL && (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <button
                    onClick={signOut}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {activeTab === 'planner' && <WeeklyPlanner />}
        {activeTab === 'recipes' && <RecipeBook />}
        {activeTab === 'shopping' && <ShoppingList />}
        {activeTab === 'admin' && <Admin />}
      </main>
    </div>
  );
}

function AppContent() {
  const { user, household, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/household setup if not authenticated or no household
  if (!user || !household) {
    return <Login />;
  }

  // Show main app
  return (
    <MealPlannerProvider>
      <MainApp />
    </MealPlannerProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
