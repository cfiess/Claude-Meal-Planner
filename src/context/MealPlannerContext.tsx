import React, { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import type { Recipe, WeekPlan, DayOfWeek, DayMeal, MealPlannerState } from '../types';
import { getMonday, generateId } from '../utils/helpers';

const DEFAULT_TAGS = [
  'quick',
  'vegetarian',
  'crockpot',
  'date night',
  'healthy',
  'comfort food',
  'grilling',
  'one-pot',
];

function createEmptyWeek(weekStartDate: string): WeekPlan {
  const emptyDay = { dinner: {}, lunch: '' };
  return {
    id: generateId(),
    weekStartDate,
    days: {
      monday: { ...emptyDay, dinner: {} },
      tuesday: { ...emptyDay, dinner: {} },
      wednesday: { ...emptyDay, dinner: {} },
      thursday: { ...emptyDay, dinner: {} },
      friday: { ...emptyDay, dinner: {} },
      saturday: { ...emptyDay, dinner: {} },
      sunday: { ...emptyDay, dinner: {} },
    },
  };
}

function getDefaultState(): MealPlannerState {
  const currentMonday = getMonday(new Date()).toISOString().split('T')[0];
  return {
    recipes: [],
    currentWeek: createEmptyWeek(currentMonday),
    weekHistory: [],
    availableTags: DEFAULT_TAGS,
  };
}

type Action =
  | { type: 'ADD_RECIPE'; recipe: Recipe }
  | { type: 'UPDATE_RECIPE'; recipe: Recipe }
  | { type: 'DELETE_RECIPE'; recipeId: string }
  | { type: 'SET_DAY_DINNER'; day: DayOfWeek; dinner: DayMeal }
  | { type: 'SET_DAY_LUNCH'; day: DayOfWeek; lunch: string }
  | { type: 'ADD_TAG'; tag: string }
  | { type: 'REMOVE_TAG'; tag: string }
  | { type: 'UPDATE_TAG'; oldTag: string; newTag: string }
  | { type: 'INCREMENT_TIMES_COOKED'; recipeId: string }
  | { type: 'LOAD_STATE'; state: MealPlannerState };

function reducer(state: MealPlannerState, action: Action): MealPlannerState {
  switch (action.type) {
    case 'ADD_RECIPE':
      return {
        ...state,
        recipes: [...state.recipes, action.recipe],
      };

    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map(r =>
          r.id === action.recipe.id ? action.recipe : r
        ),
      };

    case 'DELETE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.filter(r => r.id !== action.recipeId),
      };

    case 'SET_DAY_DINNER':
      return {
        ...state,
        currentWeek: {
          ...state.currentWeek,
          days: {
            ...state.currentWeek.days,
            [action.day]: {
              ...state.currentWeek.days[action.day],
              dinner: action.dinner,
            },
          },
        },
      };

    case 'SET_DAY_LUNCH':
      return {
        ...state,
        currentWeek: {
          ...state.currentWeek,
          days: {
            ...state.currentWeek.days,
            [action.day]: {
              ...state.currentWeek.days[action.day],
              lunch: action.lunch,
            },
          },
        },
      };

    case 'ADD_TAG':
      if (state.availableTags.includes(action.tag)) {
        return state;
      }
      return {
        ...state,
        availableTags: [...state.availableTags, action.tag],
      };

    case 'REMOVE_TAG':
      return {
        ...state,
        availableTags: state.availableTags.filter(t => t !== action.tag),
        // Also remove from all recipes
        recipes: state.recipes.map(r => ({
          ...r,
          tags: r.tags.filter(t => t !== action.tag),
        })),
      };

    case 'UPDATE_TAG':
      return {
        ...state,
        availableTags: state.availableTags.map(t =>
          t === action.oldTag ? action.newTag : t
        ),
        // Also update in all recipes
        recipes: state.recipes.map(r => ({
          ...r,
          tags: r.tags.map(t => (t === action.oldTag ? action.newTag : t)),
        })),
      };

    case 'INCREMENT_TIMES_COOKED':
      return {
        ...state,
        recipes: state.recipes.map(r =>
          r.id === action.recipeId
            ? { ...r, timesCooked: r.timesCooked + 1 }
            : r
        ),
      };

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}

interface MealPlannerContextValue {
  state: MealPlannerState;
  loading: boolean;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'timesCooked' | 'createdAt' | 'updatedAt'>) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (recipeId: string) => void;
  setDayDinner: (day: DayOfWeek, dinner: DayMeal) => void;
  setDayLunch: (day: DayOfWeek, lunch: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  updateTag: (oldTag: string, newTag: string) => void;
  incrementTimesCooked: (recipeId: string) => void;
  getRecipeById: (id: string) => Recipe | undefined;
}

const MealPlannerContext = createContext<MealPlannerContextValue | null>(null);

export function MealPlannerProvider({ children }: { children: ReactNode }) {
  const { household } = useAuth();
  const [state, dispatch] = useReducer(reducer, getDefaultState());
  const [loading, setLoading] = React.useState(true);

  // Track if we're the source of the change to avoid double-updates
  const isLocalChange = useRef(false);
  const lastSavedState = useRef<string>('');

  // Sync with Firestore when household changes
  useEffect(() => {
    if (!household) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'households', household.id, 'data', 'mealPlanner');

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      // Skip if this is our own change
      if (isLocalChange.current) {
        isLocalChange.current = false;
        return;
      }

      if (docSnap.exists()) {
        const data = docSnap.data() as MealPlannerState;
        const dataString = JSON.stringify(data);

        // Skip if data hasn't actually changed
        if (dataString === lastSavedState.current) {
          setLoading(false);
          return;
        }

        lastSavedState.current = dataString;
        const currentMonday = getMonday(new Date()).toISOString().split('T')[0];

        // Check if we need a new week
        if (data.currentWeek.weekStartDate !== currentMonday) {
          // Archive current week and start fresh
          const newState = {
            ...data,
            weekHistory: [data.currentWeek, ...data.weekHistory],
            currentWeek: createEmptyWeek(currentMonday),
          };
          dispatch({ type: 'LOAD_STATE', state: newState });
          // Save the updated state back to Firestore
          isLocalChange.current = true;
          setDoc(docRef, newState);
          lastSavedState.current = JSON.stringify(newState);
        } else {
          dispatch({ type: 'LOAD_STATE', state: data });
        }
      } else {
        // Initialize with default state
        const defaultState = getDefaultState();
        isLocalChange.current = true;
        setDoc(docRef, defaultState);
        lastSavedState.current = JSON.stringify(defaultState);
        dispatch({ type: 'LOAD_STATE', state: defaultState });
      }
      setLoading(false);
    }, (error) => {
      console.error('Error listening to Firestore:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [household]);

  // Save to Firestore
  const saveToFirestore = async (newState: MealPlannerState) => {
    if (!household) return;

    const docRef = doc(db, 'households', household.id, 'data', 'mealPlanner');
    try {
      isLocalChange.current = true;
      lastSavedState.current = JSON.stringify(newState);
      await setDoc(docRef, newState);
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      isLocalChange.current = false;
    }
  };

  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'timesCooked' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const recipe: Recipe = {
      ...recipeData,
      id: generateId(),
      timesCooked: 0,
      createdAt: now,
      updatedAt: now,
    };
    const newState = reducer(state, { type: 'ADD_RECIPE', recipe });
    dispatch({ type: 'ADD_RECIPE', recipe });
    saveToFirestore(newState);
  };

  const updateRecipe = (recipe: Recipe) => {
    const updatedRecipe = { ...recipe, updatedAt: new Date().toISOString() };
    const newState = reducer(state, { type: 'UPDATE_RECIPE', recipe: updatedRecipe });
    dispatch({ type: 'UPDATE_RECIPE', recipe: updatedRecipe });
    saveToFirestore(newState);
  };

  const deleteRecipe = (recipeId: string) => {
    const newState = reducer(state, { type: 'DELETE_RECIPE', recipeId });
    dispatch({ type: 'DELETE_RECIPE', recipeId });
    saveToFirestore(newState);
  };

  const setDayDinner = (day: DayOfWeek, dinner: DayMeal) => {
    const newState = reducer(state, { type: 'SET_DAY_DINNER', day, dinner });
    dispatch({ type: 'SET_DAY_DINNER', day, dinner });
    saveToFirestore(newState);
  };

  const setDayLunch = (day: DayOfWeek, lunch: string) => {
    const newState = reducer(state, { type: 'SET_DAY_LUNCH', day, lunch });
    dispatch({ type: 'SET_DAY_LUNCH', day, lunch });
    saveToFirestore(newState);
  };

  const addTag = (tag: string) => {
    const newState = reducer(state, { type: 'ADD_TAG', tag });
    dispatch({ type: 'ADD_TAG', tag });
    saveToFirestore(newState);
  };

  const removeTag = (tag: string) => {
    const newState = reducer(state, { type: 'REMOVE_TAG', tag });
    dispatch({ type: 'REMOVE_TAG', tag });
    saveToFirestore(newState);
  };

  const updateTag = (oldTag: string, newTag: string) => {
    const newState = reducer(state, { type: 'UPDATE_TAG', oldTag, newTag });
    dispatch({ type: 'UPDATE_TAG', oldTag, newTag });
    saveToFirestore(newState);
  };

  const incrementTimesCooked = (recipeId: string) => {
    const newState = reducer(state, { type: 'INCREMENT_TIMES_COOKED', recipeId });
    dispatch({ type: 'INCREMENT_TIMES_COOKED', recipeId });
    saveToFirestore(newState);
  };

  const getRecipeById = (id: string) => {
    return state.recipes.find(r => r.id === id);
  };

  return (
    <MealPlannerContext.Provider
      value={{
        state,
        loading,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        setDayDinner,
        setDayLunch,
        addTag,
        removeTag,
        updateTag,
        incrementTimesCooked,
        getRecipeById,
      }}
    >
      {children}
    </MealPlannerContext.Provider>
  );
}

export function useMealPlanner() {
  const context = useContext(MealPlannerContext);
  if (!context) {
    throw new Error('useMealPlanner must be used within a MealPlannerProvider');
  }
  return context;
}
