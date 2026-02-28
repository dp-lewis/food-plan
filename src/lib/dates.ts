/**
 * Shared date utilities for meal plan day calculations.
 * startDay convention: 0=Monday, 1=Tuesday, ..., 6=Sunday
 */

import { Meal, MealType } from '@/types';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner'];

/**
 * Determine which meal slot is "up next" based on the current hour and today's plan index.
 * Falls back to the first meal of the next day if all today's meals have passed.
 */
export function getUpNextSlot(
  todayIndex: number,
  meals: Meal[],
  hour: number
): { meals: Meal[]; mealType: MealType; label: string } | null {
  let candidateMealTypes: MealType[];
  const dayIndex = todayIndex;

  if (hour < 11) {
    candidateMealTypes = ['breakfast', 'lunch', 'dinner'];
  } else if (hour < 15) {
    candidateMealTypes = ['lunch', 'dinner'];
  } else {
    candidateMealTypes = ['dinner'];
  }

  const dayMeals = meals.filter((m) => m.dayIndex === dayIndex);

  for (const mt of candidateMealTypes) {
    const slotMeals = dayMeals.filter((m) => m.mealType === mt);
    if (slotMeals.length > 0) {
      return { meals: slotMeals, mealType: mt, label: 'Up next' };
    }
  }

  // Fallback: if nothing matched today, try tomorrow
  const tomorrowIndex = (todayIndex + 1) % 7;
  const tomorrowMeals = meals.filter((m) => m.dayIndex === tomorrowIndex);
  for (const mt of MEAL_ORDER) {
    const slotMeals = tomorrowMeals.filter((m) => m.mealType === mt);
    if (slotMeals.length > 0) {
      return { meals: slotMeals, mealType: mt, label: 'Tomorrow' };
    }
  }

  return null;
}

export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Get today's dayIndex within the plan based on the plan's startDay.
 * startDay uses 0=Monday ... 6=Sunday.
 * Returns 0-6, where 0 is the plan's first day.
 */
export function getTodayPlanIndex(startDay: number): number {
  const now = new Date();
  // JS getDay(): 0=Sunday, 1=Monday ... 6=Saturday
  // Convert to our system: 0=Monday ... 6=Sunday
  const jsDay = now.getDay();
  const todayIndex = jsDay === 0 ? 6 : jsDay - 1;
  // How many days from startDay to today (wrapping around the week)
  return (todayIndex - startDay + 7) % 7;
}

/**
 * Get the day name for a plan dayIndex given the startDay.
 */
export function getDayName(startDay: number, dayIndex: number): string {
  return DAYS[(startDay + dayIndex) % 7];
}

/**
 * Get ordered day names starting from the plan's startDay.
 */
export function getOrderedDays(startDay: number): string[] {
  return Array.from({ length: 7 }, (_, i) => DAYS[(startDay + i) % 7]);
}

/**
 * Get the formatted date string (e.g. "Feb 15") for a given dayIndex in the plan.
 * When weekStart is provided, dates are anchored to that fixed date instead of today.
 */
export function getDateForDayIndex(startDay: number, dayIndex: number, weekStart?: string): string {
  if (weekStart) {
    // Anchor to the plan's fixed week start date
    const start = new Date(weekStart + 'T12:00:00'); // noon avoids DST edge cases
    const date = new Date(start);
    date.setDate(start.getDate() + dayIndex);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  // Fallback: original behavior (relative to today)
  const now = new Date();
  const jsDay = now.getDay();
  const todayWeekday = jsDay === 0 ? 6 : jsDay - 1; // 0=Mon...6=Sun
  const todayPlanIndex = (todayWeekday - startDay + 7) % 7;
  const diff = dayIndex - todayPlanIndex;
  const date = new Date(now);
  date.setDate(date.getDate() + diff);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
