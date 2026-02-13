import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface Household {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
}

interface AuthContextType {
  user: User | null;
  household: Household | null;
  loading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (householdId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Listen for auth state changes (works for both existing Google users and anonymous users)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        try {
          // Check if user has a household
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.householdId) {
              const householdDoc = await getDoc(doc(db, 'households', userData.householdId));
              if (householdDoc.exists()) {
                setHousehold({ id: householdDoc.id, ...householdDoc.data() } as Household);
              }
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          // Still allow the user to proceed - they're authenticated
        }
      } else {
        setHousehold(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setHousehold(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const createHousehold = async (name: string) => {
    setAuthError(null);

    try {
      // Sign in anonymously if not already signed in
      let currentUser = user;
      if (!currentUser) {
        try {
          const result = await signInAnonymously(auth);
          currentUser = result.user;
          setUser(currentUser);
        } catch (authError: unknown) {
          // Handle specific Firebase auth errors with user-friendly messages
          const errorCode = (authError as { code?: string })?.code;
          if (errorCode === 'auth/admin-restricted-operation') {
            throw new Error(
              'Anonymous sign-in is not enabled. Please ask the app administrator to enable Anonymous Authentication in Firebase Console → Authentication → Sign-in method.'
            );
          }
          throw authError;
        }
      }

      const householdId = `household_${currentUser.uid}_${Date.now()}`;
      const householdData: Household = {
        id: householdId,
        name,
        members: [currentUser.uid],
        createdBy: currentUser.uid,
      };

      // Create household document
      await setDoc(doc(db, 'households', householdId), householdData);

      // Create/update user document with household reference
      await setDoc(doc(db, 'users', currentUser.uid), {
        createdAt: new Date().toISOString(),
        householdId,
      }, { merge: true });

      setHousehold(householdData);
    } catch (error) {
      console.error('Error creating household:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create household';
      setAuthError(errorMessage);
      throw error;
    }
  };

  const joinHousehold = async (rawHouseholdId: string) => {
    setAuthError(null);

    // Sanitize the pasted code: remove whitespace, line breaks, invisible chars
    const householdId = rawHouseholdId
      .replace(/[\s\u200B\u200C\u200D\uFEFF\n\r\t]/g, '');

    if (!householdId) {
      const error = new Error('Please enter a valid household code');
      setAuthError(error.message);
      throw error;
    }

    try {
      // Sign in anonymously if not already signed in
      let currentUser = user;
      if (!currentUser) {
        try {
          const result = await signInAnonymously(auth);
          currentUser = result.user;
          setUser(currentUser);
        } catch (authError: unknown) {
          // Handle specific Firebase auth errors with user-friendly messages
          const errorCode = (authError as { code?: string })?.code;
          if (errorCode === 'auth/admin-restricted-operation') {
            throw new Error(
              'Anonymous sign-in is not enabled. Please ask the app administrator to enable Anonymous Authentication in Firebase Console → Authentication → Sign-in method.'
            );
          }
          throw authError;
        }
      }

      const householdRef = doc(db, 'households', householdId);
      const householdDoc = await getDoc(householdRef);

      if (!householdDoc.exists()) {
        const codePreview = householdId.length > 50
          ? `${householdId.substring(0, 50)}...`
          : householdId;
        const error = new Error(
          `Household not found. Make sure the code is correct (it should start with "household_"). Code received: "${codePreview}"`
        );
        setAuthError(error.message);
        throw error;
      }

      const householdData = householdDoc.data() as Household;

      // Add user to household members if not already there
      if (!householdData.members.includes(currentUser.uid)) {
        await setDoc(householdRef, {
          members: [...householdData.members, currentUser.uid],
        }, { merge: true });
      }

      // Create/update user document with household reference
      await setDoc(doc(db, 'users', currentUser.uid), {
        createdAt: new Date().toISOString(),
        householdId,
      }, { merge: true });

      setHousehold({ ...householdData, id: householdId });
    } catch (error) {
      console.error('Error joining household:', error);
      if (error instanceof Error && !authError) {
        setAuthError(error.message);
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        household,
        loading,
        authError,
        signOut,
        createHousehold,
        joinHousehold,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
