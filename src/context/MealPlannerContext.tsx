import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Recipe, WeekPlan, DayOfWeek, DayMeal, MealPlannerState } from '../types';
import { getMonday, generateId } from '../utils/helpers';

const STORAGE_KEY = 'meal-planner-data';

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

function getInitialState(): MealPlannerState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as MealPlannerState;
      const currentMonday = getMonday(new Date()).toISOString().split('T')[0];

      // Check if we need a new week
      if (parsed.currentWeek.weekStartDate !== currentMonday) {
        // Archive current week and start fresh
        return {
          ...parsed,
          weekHistory: [parsed.currentWeek, ...parsed.weekHistory],
          currentWeek: createEmptyWeek(currentMonday),
        };
      }
      return parsed;
    } catch {
      // Invalid stored data, start fresh
    }
  }

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
  addRecipe: (recipe: Omit<Recipe, 'id' | 'timesCooked' | 'createdAt' | 'updatedAt'>) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (recipeId: string) => void;
  setDayDinner: (day: DayOfWeek, dinner: DayMeal) => void;
  setDayLunch: (day: DayOfWeek, lunch: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  incrementTimesCooked: (recipeId: string) => void;
  getRecipeById: (id: string) => Recipe | undefined;
}

const MealPlannerContext = createContext<MealPlannerContextValue | null>(null);

export function MealPlannerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, getInitialState);

  // Persist to localStorage on every state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'timesCooked' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const recipe: Recipe = {
      ...recipeData,
      id: generateId(),
      timesCooked: 0,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_RECIPE', recipe });
  };

  const updateRecipe = (recipe: Recipe) => {
    dispatch({ type: 'UPDATE_RECIPE', recipe: { ...recipe, updatedAt: new Date().toISOString() } });
  };

  const deleteRecipe = (recipeId: string) => {
    dispatch({ type: 'DELETE_RECIPE', recipeId });
  };

  const setDayDinner = (day: DayOfWeek, dinner: DayMeal) => {
    dispatch({ type: 'SET_DAY_DINNER', day, dinner });
  };

  const setDayLunch = (day: DayOfWeek, lunch: string) => {
    dispatch({ type: 'SET_DAY_LUNCH', day, lunch });
  };

  const addTag = (tag: string) => {
    dispatch({ type: 'ADD_TAG', tag });
  };

  const removeTag = (tag: string) => {
    dispatch({ type: 'REMOVE_TAG', tag });
  };

  const incrementTimesCooked = (recipeId: string) => {
    dispatch({ type: 'INCREMENT_TIMES_COOKED', recipeId });
  };

  const getRecipeById = (id: string) => {
    return state.recipes.find(r => r.id === id);
  };

  return (
    <MealPlannerContext.Provider
      value={{
        state,
        addRecipe,
        updateRecipe,
        deleteRecipe,
        setDayDinner,
        setDayLunch,
        addTag,
        removeTag,
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
