import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { household, authError, createHousehold, joinHousehold } = useAuth();
  const [householdName, setHouseholdName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Display either local error or auth error from context
  const displayError = error || authError;

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      setError('Please enter a household name');
      return;
    }
    try {
      setError('');
      setIsLoading(true);
      await createHousehold(householdName.trim());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create household. Please try again.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a household code');
      return;
    }
    try {
      setError('');
      setIsLoading(true);
      await joinHousehold(joinCode);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join household. Check the code and try again.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Already has a household - App.tsx will show the main app
  if (household) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Meal Planner</h1>
          <p className="text-gray-600">Plan your weekly meals together</p>
        </div>

        {displayError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
            {displayError}
          </div>
        )}

        {!showJoin ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Household Name
              </label>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="e.g., The Smiths"
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleCreateHousehold}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create New Household'}
            </button>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="text-amber-800 font-medium mb-1">Important: Save your household code!</p>
              <p className="text-amber-700">
                After creating a household, go to Settings &rarr; Household to copy your code.
                You'll need it to access your data from other devices or if you clear your browser.
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => { setShowJoin(true); setError(''); }}
                className="text-blue-600 hover:text-blue-700 text-sm"
                disabled={isLoading}
              >
                Or join an existing household
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Household Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Paste the household code"
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste your household code to join or recover access to your data
              </p>
            </div>
            <button
              onClick={handleJoinHousehold}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Joining...' : 'Join Household'}
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-800 font-medium mb-1">Lost access to your data?</p>
              <p className="text-blue-700">
                If you previously had a household and can't see your recipes, enter your
                old household code here to recover access. The code looks like "household_..."
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => { setShowJoin(false); setError(''); }}
                className="text-blue-600 hover:text-blue-700 text-sm"
                disabled={isLoading}
              >
                Or create a new household
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
