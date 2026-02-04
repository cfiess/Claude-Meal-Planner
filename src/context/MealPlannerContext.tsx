import React, { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import type { Recipe, WeekPlan, DayOfWeek, DayMeal, MealPlannerState } from '../types';
import { getMonday, getNextMonday, generateId } from '../utils/helpers';

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
  const nextMonday = getNextMonday(new Date()).toISOString().split('T')[0];
  return {
    recipes: [],
    currentWeek: createEmptyWeek(currentMonday),
    nextWeek: createEmptyWeek(nextMonday),
    weekHistory: [],
    availableTags: DEFAULT_TAGS,
  };
}

// Count recipes used in a week and increment their timesCooked
function incrementRecipeCounts(recipes: Recipe[], week: WeekPlan): Recipe[] {
  const recipeCountMap = new Map<string, number>();

  // Count how many times each recipe is used in the week
  Object.values(week.days).forEach(day => {
    if (day.dinner.recipeId) {
      const count = recipeCountMap.get(day.dinner.recipeId) || 0;
      recipeCountMap.set(day.dinner.recipeId, count + 1);
    }
  });

  // Increment timesCooked for each recipe
  return recipes.map(r => {
    const count = recipeCountMap.get(r.id);
    if (count) {
      return { ...r, timesCooked: r.timesCooked + count };
    }
    return r;
  });
}

type Action =
  | { type: 'ADD_RECIPE'; recipe: Recipe }
  | { type: 'UPDATE_RECIPE'; recipe: Recipe }
  | { type: 'DELETE_RECIPE'; recipeId: string }
  | { type: 'SET_DAY_DINNER'; day: DayOfWeek; dinner: DayMeal; week: 'current' | 'next' }
  | { type: 'SET_DAY_LUNCH'; day: DayOfWeek; lunch: string; week: 'current' | 'next' }
  | { type: 'ADD_TAG'; tag: string }
  | { type: 'REMOVE_TAG'; tag: string }
  | { type: 'UPDATE_TAG'; oldTag: string; newTag: string }
  | { type: 'RESET_TIMES_COOKED' }
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
      if (action.week === 'current') {
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
      } else {
        return {
          ...state,
          nextWeek: {
            ...state.nextWeek,
            days: {
              ...state.nextWeek.days,
              [action.day]: {
                ...state.nextWeek.days[action.day],
                dinner: action.dinner,
              },
            },
          },
        };
      }

    case 'SET_DAY_LUNCH':
      if (action.week === 'current') {
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
      } else {
        return {
          ...state,
          nextWeek: {
            ...state.nextWeek,
            days: {
              ...state.nextWeek.days,
              [action.day]: {
                ...state.nextWeek.days[action.day],
                lunch: action.lunch,
              },
            },
          },
        };
      }

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
        recipes: state.recipes.map(r => ({
          ...r,
          tags: r.tags.map(t => (t === action.oldTag ? action.newTag : t)),
        })),
      };

    case 'RESET_TIMES_COOKED':
      return {
        ...state,
        recipes: state.recipes.map(r => ({ ...r, timesCooked: 0 })),
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
  setDayDinner: (day: DayOfWeek, dinner: DayMeal, week?: 'current' | 'next') => void;
  setDayLunch: (day: DayOfWeek, lunch: string, week?: 'current' | 'next') => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  updateTag: (oldTag: string, newTag: string) => void;
  resetTimesCooked: () => void;
  getRecipeById: (id: string) => Recipe | undefined;
}

const MealPlannerContext = createContext<MealPlannerContextValue | null>(null);

export function MealPlannerProvider({ children }: { children: ReactNode }) {
  const { household } = useAuth();
  const [state, dispatch] = useReducer(reducer, getDefaultState());
  const [loading, setLoading] = React.useState(true);

  const isLocalChange = useRef(false);
  const lastSavedState = useRef<string>('');

  useEffect(() => {
    if (!household) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'households', household.id, 'data', 'mealPlanner');

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (isLocalChange.current) {
        isLocalChange.current = false;
        return;
      }

      if (docSnap.exists()) {
        const data = docSnap.data() as MealPlannerState;
        const dataString = JSON.stringify(data);

        if (dataString === lastSavedState.current) {
          setLoading(false);
          return;
        }

        lastSavedState.current = dataString;
        const currentMonday = getMonday(new Date()).toISOString().split('T')[0];
        const nextMonday = getNextMonday(new Date()).toISOString().split('T')[0];

        // Check if we need to transition weeks
        if (data.currentWeek.weekStartDate !== currentMonday) {
          // Increment times cooked for recipes in the archived week
          const updatedRecipes = incrementRecipeCounts(data.recipes, data.currentWeek);

          // Archive current week, move next week to current, create new next week
          const newState: MealPlannerState = {
            ...data,
            recipes: updatedRecipes,
            weekHistory: [data.currentWeek, ...data.weekHistory],
            currentWeek: data.nextWeek?.weekStartDate === currentMonday
              ? data.nextWeek
              : createEmptyWeek(currentMonday),
            nextWeek: createEmptyWeek(nextMonday),
          };
          dispatch({ type: 'LOAD_STATE', state: newState });
          isLocalChange.current = true;
          setDoc(docRef, newState);
          lastSavedState.current = JSON.stringify(newState);
        } else {
          // Ensure nextWeek exists and has correct date
          if (!data.nextWeek || data.nextWeek.weekStartDate !== nextMonday) {
            const newState = {
              ...data,
              nextWeek: createEmptyWeek(nextMonday),
            };
            dispatch({ type: 'LOAD_STATE', state: newState });
            isLocalChange.current = true;
            setDoc(docRef, newState);
            lastSavedState.current = JSON.stringify(newState);
          } else {
            dispatch({ type: 'LOAD_STATE', state: data });
          }
        }
      } else {
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

  const setDayDinner = (day: DayOfWeek, dinner: DayMeal, week: 'current' | 'next' = 'current') => {
    const newState = reducer(state, { type: 'SET_DAY_DINNER', day, dinner, week });
    dispatch({ type: 'SET_DAY_DINNER', day, dinner, week });
    saveToFirestore(newState);
  };

  const setDayLunch = (day: DayOfWeek, lunch: string, week: 'current' | 'next' = 'current') => {
    const newState = reducer(state, { type: 'SET_DAY_LUNCH', day, lunch, week });
    dispatch({ type: 'SET_DAY_LUNCH', day, lunch, week });
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

  const resetTimesCooked = () => {
    const newState = reducer(state, { type: 'RESET_TIMES_COOKED' });
    dispatch({ type: 'RESET_TIMES_COOKED' });
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
        resetTimesCooked,
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
