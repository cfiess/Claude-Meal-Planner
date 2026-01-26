export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category: GroceryCategory;
}

export type GroceryCategory =
  | 'produce'
  | 'meat'
  | 'dairy'
  | 'bakery'
  | 'frozen'
  | 'pantry'
  | 'beverages'
  | 'condiments'
  | 'other';

export interface Recipe {
  id: string;
  name: string;
  link?: string;
  ingredients?: Ingredient[];
  steps?: string[];
  tags: string[];
  timesCooked: number;
  createdAt: string;
  updatedAt: string;
}

export interface DayMeal {
  recipeId?: string;
  customMealName?: string;
  customLink?: string;
  notes?: string;
}

export interface DayPlan {
  dinner: DayMeal;
  lunch: string;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface WeekPlan {
  id: string;
  weekStartDate: string; // ISO date string for Monday
  days: Record<DayOfWeek, DayPlan>;
}

export interface ShoppingListItem {
  ingredient: Ingredient;
  quantity: number;
  checked: boolean;
}

export interface MealPlannerState {
  recipes: Recipe[];
  currentWeek: WeekPlan;
  weekHistory: WeekPlan[];
  availableTags: string[];
}
