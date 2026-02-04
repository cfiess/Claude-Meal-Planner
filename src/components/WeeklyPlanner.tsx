import { useMealPlanner } from '../context/MealPlannerContext';
import type { DayOfWeek } from '../types';
import { DayCard } from './DayCard';
import { getDayDate } from '../utils/helpers';

const DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export function WeeklyPlanner() {
  const { state } = useMealPlanner();

  return (
    <div className="p-6">
      {/* This Week */}
      <div className="mb-10">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800">This Week</h2>
          <p className="text-gray-500">
            Week of {getDayDate(state.currentWeek.weekStartDate, 0)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map((day, index) => (
            <DayCard
              key={`current-${day}`}
              day={day}
              label={DAY_LABELS[day]}
              date={getDayDate(state.currentWeek.weekStartDate, index)}
              plan={state.currentWeek.days[day]}
              week="current"
            />
          ))}
        </div>
      </div>

      {/* Next Week */}
      <div className="border-t-4 border-blue-200 pt-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Next Week</h2>
          <p className="text-gray-500">
            Week of {getDayDate(state.nextWeek.weekStartDate, 0)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map((day, index) => (
            <DayCard
              key={`next-${day}`}
              day={day}
              label={DAY_LABELS[day]}
              date={getDayDate(state.nextWeek.weekStartDate, index)}
              plan={state.nextWeek.days[day]}
              week="next"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
