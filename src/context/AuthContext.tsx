import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (householdId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
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
      } else {
        setHousehold(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Create user document if it doesn't exist
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

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
    if (!user) throw new Error('Must be logged in to create a household');

    try {
      const householdId = `household_${user.uid}_${Date.now()}`;
      const householdData: Household = {
        id: householdId,
        name,
        members: [user.uid],
        createdBy: user.uid,
      };

      // Create household document
      await setDoc(doc(db, 'households', householdId), householdData);

      // Update user with household reference
      await setDoc(doc(db, 'users', user.uid), {
        householdId,
      }, { merge: true });

      setHousehold(householdData);
    } catch (error) {
      console.error('Error creating household:', error);
      throw error;
    }
  };

  const joinHousehold = async (householdId: string) => {
    if (!user) throw new Error('Must be logged in to join a household');

    try {
      const householdRef = doc(db, 'households', householdId);
      const householdDoc = await getDoc(householdRef);

      if (!householdDoc.exists()) {
        throw new Error('Household not found');
      }

      const householdData = householdDoc.data() as Household;

      // Add user to household members if not already there
      if (!householdData.members.includes(user.uid)) {
        await setDoc(householdRef, {
          members: [...householdData.members, user.uid],
        }, { merge: true });
      }

      // Update user with household reference
      await setDoc(doc(db, 'users', user.uid), {
        householdId,
      }, { merge: true });

      setHousehold({ ...householdData, id: householdId });
    } catch (error) {
      console.error('Error joining household:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        household,
        loading,
        signInWithGoogle,
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
