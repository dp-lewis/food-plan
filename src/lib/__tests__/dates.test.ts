import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DAYS,
  getTodayPlanIndex,
  getDayName,
  getOrderedDays,
  getDateForDayIndex,
  getUpNextSlot,
} from '../dates';
import type { Meal } from '@/types';

// ---------------------------------------------------------------------------
// DAYS constant
// ---------------------------------------------------------------------------

describe('DAYS', () => {
  it('contains exactly 7 day names', () => {
    expect(DAYS).toHaveLength(7);
  });

  it('starts on Monday (index 0)', () => {
    expect(DAYS[0]).toBe('Monday');
  });

  it('ends on Sunday (index 6)', () => {
    expect(DAYS[6]).toBe('Sunday');
  });

  it('contains all expected day names', () => {
    expect(DAYS).toEqual([
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    ]);
  });
});

// ---------------------------------------------------------------------------
// getDayName
// ---------------------------------------------------------------------------

describe('getDayName', () => {
  it('returns Monday when startDay=0 and dayIndex=0', () => {
    expect(getDayName(0, 0)).toBe('Monday');
  });

  it('returns Tuesday when startDay=0 and dayIndex=1', () => {
    expect(getDayName(0, 1)).toBe('Tuesday');
  });

  it('wraps around correctly: startDay=5 (Saturday) dayIndex=0 => Saturday', () => {
    expect(getDayName(5, 0)).toBe('Saturday');
  });

  it('wraps around correctly: startDay=6 (Sunday) dayIndex=1 => Monday', () => {
    expect(getDayName(6, 1)).toBe('Monday');
  });

  it('wraps around correctly: startDay=5 dayIndex=2 => Monday', () => {
    expect(getDayName(5, 2)).toBe('Monday');
  });

  it('works for mid-week start: startDay=2 (Wednesday) dayIndex=0 => Wednesday', () => {
    expect(getDayName(2, 0)).toBe('Wednesday');
  });
});

// ---------------------------------------------------------------------------
// getOrderedDays
// ---------------------------------------------------------------------------

describe('getOrderedDays', () => {
  it('returns 7 days', () => {
    expect(getOrderedDays(0)).toHaveLength(7);
  });

  it('starts from Monday when startDay=0', () => {
    const days = getOrderedDays(0);
    expect(days[0]).toBe('Monday');
    expect(days[6]).toBe('Sunday');
  });

  it('starts from Saturday when startDay=5', () => {
    const days = getOrderedDays(5);
    expect(days[0]).toBe('Saturday');
    expect(days[1]).toBe('Sunday');
    expect(days[2]).toBe('Monday');
  });

  it('starts from Sunday when startDay=6', () => {
    const days = getOrderedDays(6);
    expect(days[0]).toBe('Sunday');
    expect(days[1]).toBe('Monday');
    expect(days[6]).toBe('Saturday');
  });

  it('contains all 7 unique days', () => {
    const days = getOrderedDays(3);
    const unique = new Set(days);
    expect(unique.size).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// getTodayPlanIndex
// ---------------------------------------------------------------------------

describe('getTodayPlanIndex', () => {
  // JS getDay(): 0=Sunday, 1=Monday … 6=Saturday
  // Our system: 0=Monday, 1=Tuesday … 6=Sunday

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 when today is Monday and startDay is Monday (0)', () => {
    // Arrange: Monday = JS getDay() 1
    vi.setSystemTime(new Date('2025-01-06T12:00:00Z')); // Monday
    // Act
    const idx = getTodayPlanIndex(0);
    // Assert
    expect(idx).toBe(0);
  });

  it('returns 1 when today is Tuesday and startDay is Monday (0)', () => {
    vi.setSystemTime(new Date('2025-01-07T12:00:00Z')); // Tuesday
    expect(getTodayPlanIndex(0)).toBe(1);
  });

  it('returns 6 when today is Sunday and startDay is Monday (0)', () => {
    vi.setSystemTime(new Date('2025-01-12T12:00:00Z')); // Sunday
    expect(getTodayPlanIndex(0)).toBe(6);
  });

  it('returns 0 when today is Wednesday and startDay is Wednesday (2)', () => {
    vi.setSystemTime(new Date('2025-01-08T12:00:00Z')); // Wednesday
    expect(getTodayPlanIndex(2)).toBe(0);
  });

  it('returns 1 when today is Thursday and startDay is Wednesday (2)', () => {
    vi.setSystemTime(new Date('2025-01-09T12:00:00Z')); // Thursday
    expect(getTodayPlanIndex(2)).toBe(1);
  });

  it('returns 6 when today is Tuesday and startDay is Wednesday (2)', () => {
    vi.setSystemTime(new Date('2025-01-07T12:00:00Z')); // Tuesday
    expect(getTodayPlanIndex(2)).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// getDateForDayIndex
// ---------------------------------------------------------------------------

describe('getDateForDayIndex', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fix today to Monday 6 Jan 2025
    vi.setSystemTime(new Date('2025-01-06T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns today\'s date string for the current day index', () => {
    // Today is Monday (index 0 for startDay=0)
    const dateStr = getDateForDayIndex(0, 0);
    expect(dateStr).toContain('Jan');
    expect(dateStr).toContain('6');
  });

  it('returns tomorrow\'s date for dayIndex 1 when startDay=0', () => {
    const dateStr = getDateForDayIndex(0, 1);
    expect(dateStr).toContain('Jan');
    expect(dateStr).toContain('7');
  });

  it('returns a date 6 days ahead for the last plan day when startDay=0', () => {
    // With startDay=0, today (Monday Jan 6) = planIndex 0
    // planIndex 6 = today + 6 days = Jan 12 (Sunday)
    const dateStr = getDateForDayIndex(0, 6);
    expect(dateStr).toContain('Jan');
    expect(dateStr).toContain('12');
  });

  it('returns a formatted date string with month and day', () => {
    const dateStr = getDateForDayIndex(0, 0);
    // Format: "Jan 6" (month short + day)
    expect(typeof dateStr).toBe('string');
    expect(dateStr.length).toBeGreaterThan(0);
    // Should contain month abbreviation
    expect(/[A-Z][a-z]+/.test(dateStr)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getUpNextSlot
// ---------------------------------------------------------------------------

describe('getUpNextSlot', () => {
  // Helpers
  function meal(id: string, dayIndex: number, mealType: Meal['mealType']): Meal {
    return { id, dayIndex, mealType, recipeId: `recipe-${id}`, servings: 4 };
  }

  const todayMeals: Meal[] = [
    meal('b', 0, 'breakfast'),
    meal('l', 0, 'lunch'),
    meal('d', 0, 'dinner'),
  ];

  const tomorrowMeals: Meal[] = [
    meal('tb', 1, 'breakfast'),
    meal('tl', 1, 'lunch'),
    meal('td', 1, 'dinner'),
  ];

  describe('hour < 11 (morning)', () => {
    it('returns breakfast slot when breakfast exists', () => {
      // Arrange / Act
      const result = getUpNextSlot(0, todayMeals, 9);
      // Assert
      expect(result).not.toBeNull();
      expect(result!.mealType).toBe('breakfast');
      expect(result!.label).toBe('Up next');
    });

    it('returns lunch when no breakfast but lunch exists', () => {
      const noBreakfast = todayMeals.filter((m) => m.mealType !== 'breakfast');
      const result = getUpNextSlot(0, noBreakfast, 9);
      expect(result!.mealType).toBe('lunch');
    });
  });

  describe('11 <= hour < 15 (midday)', () => {
    it('returns lunch slot when lunch exists', () => {
      const result = getUpNextSlot(0, todayMeals, 12);
      expect(result).not.toBeNull();
      expect(result!.mealType).toBe('lunch');
      expect(result!.label).toBe('Up next');
    });

    it('skips breakfast even if it exists', () => {
      const result = getUpNextSlot(0, todayMeals, 13);
      expect(result!.mealType).not.toBe('breakfast');
    });

    it('returns dinner when no lunch exists', () => {
      const noLunch = todayMeals.filter((m) => m.mealType !== 'lunch');
      const result = getUpNextSlot(0, noLunch, 14);
      expect(result!.mealType).toBe('dinner');
    });
  });

  describe('hour >= 15 (evening)', () => {
    it('returns dinner slot when dinner exists', () => {
      const result = getUpNextSlot(0, todayMeals, 17);
      expect(result).not.toBeNull();
      expect(result!.mealType).toBe('dinner');
      expect(result!.label).toBe('Up next');
    });

    it('returns the correct meal objects', () => {
      const result = getUpNextSlot(0, todayMeals, 20);
      expect(result!.meals).toHaveLength(1);
      expect(result!.meals[0].id).toBe('d');
    });
  });

  describe('fallback to tomorrow', () => {
    it('returns tomorrow\'s breakfast when all today meals have passed (hour >= 15, no dinner today)', () => {
      // Today has no dinner, tomorrow has meals — should fall back to tomorrow
      const noDinnerToday = todayMeals.filter((m) => m.mealType !== 'dinner');
      const allMeals = [...noDinnerToday, ...tomorrowMeals];
      const result = getUpNextSlot(0, allMeals, 20);
      expect(result).not.toBeNull();
      expect(result!.label).toBe('Tomorrow');
      expect(result!.mealType).toBe('breakfast');
    });

    it('returns null when no meals exist at all', () => {
      const result = getUpNextSlot(0, [], 12);
      expect(result).toBeNull();
    });

    it('returns null when today has no suitable meals and tomorrow is also empty', () => {
      // No dinner today, no tomorrow meals either
      const noDinnerToday = todayMeals.filter((m) => m.mealType !== 'dinner');
      const result = getUpNextSlot(0, noDinnerToday, 20);
      expect(result).toBeNull();
    });

    it('wraps tomorrow index correctly at end of week (dayIndex 6 => tomorrow is 0)', () => {
      // Today is day 6, tomorrow wraps to day 0
      const day6Meals: Meal[] = [
        meal('d6', 6, 'dinner'),    // today (no match for hour < 11 dinner excluded — breakfast needed)
      ];
      // Hour is 20, so only dinner is candidate. day6 has dinner.
      const result = getUpNextSlot(6, day6Meals, 20);
      expect(result).not.toBeNull();
      expect(result!.mealType).toBe('dinner');
    });
  });

  describe('multiple meals in a slot', () => {
    it('returns all meals when multiple meals share the same dayIndex and mealType', () => {
      const multiDinner: Meal[] = [
        meal('d1', 0, 'dinner'),
        meal('d2', 0, 'dinner'),
      ];
      const result = getUpNextSlot(0, multiDinner, 18);
      expect(result).not.toBeNull();
      expect(result!.meals).toHaveLength(2);
    });
  });
});
