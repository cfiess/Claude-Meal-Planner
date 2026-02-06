import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { user, household, authError, signInWithGoogle, signOut, createHousehold, joinHousehold } = useAuth();
  const [householdName, setHouseholdName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Display either local error or auth error from context
  const displayError = error || authError;

  const handleSignIn = async () => {
    try {
      setError('');
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      // Error is already set in authError from context
      console.error(err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      setError('Please enter a household name');
      return;
    }
    try {
      setError('');
      await createHousehold(householdName.trim());
    } catch (err) {
      setError('Failed to create household. Please try again.');
      console.error(err);
    }
  };

  const handleJoinHousehold = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a household code');
      return;
    }
    try {
      setError('');
      await joinHousehold(joinCode.trim());
    } catch (err) {
      setError('Failed to join household. Check the code and try again.');
      console.error(err);
    }
  };

  // Not signed in
  if (!user) {
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

          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-700 font-medium">
              {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Signed in but no household
  if (!household) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user.displayName?.split(' ')[0]}!</h1>
            <p className="text-gray-600">Set up your household to get started</p>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleCreateHousehold}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Household
              </button>
              <div className="text-center">
                <button
                  onClick={() => setShowJoin(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ask your partner for the household code from their Settings page
                </p>
              </div>
              <button
                onClick={handleJoinHousehold}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Join Household
              </button>
              <div className="text-center">
                <button
                  onClick={() => setShowJoin(false)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Or create a new household
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              onClick={signOut}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // This shouldn't render - App.tsx will show the main app when household exists
  return null;
}
