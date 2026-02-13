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
  const { loading, syncError } = useMealPlanner();

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
    <div className="min-h-screen bg-gray-100 pb-16 md:pb-0 overflow-x-hidden">
      {/* Sync Error Banner */}
      {syncError && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-sm text-center z-50">
          {syncError}
        </div>
      )}

      {/* Header */}
      <header className={`bg-white shadow-sm sticky ${syncError ? 'top-8' : 'top-0'} z-40`}>
        <div className="max-w-7xl mx-auto px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Meal Planner</h1>
              {household && (
                <p className="text-xs text-gray-500 truncate">{household.name}</p>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-1 items-center">
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

            {/* Mobile user menu */}
            {user && (
              <div className="md:hidden flex items-center gap-2">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full"
                  />
                )}
                <button
                  onClick={signOut}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            )}
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

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="flex justify-around items-center h-14">
          <button
            onClick={() => setActiveTab('planner')}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              activeTab === 'planner' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs mt-0.5">Plan</span>
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              activeTab === 'recipes' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs mt-0.5">Recipes</span>
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              activeTab === 'shopping' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs mt-0.5">Shop</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center flex-1 h-full ${
              activeTab === 'admin' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-0.5">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function AppContent() {
  const { household, loading } = useAuth();

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

  // Show login/household setup if no household
  if (!household) {
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
