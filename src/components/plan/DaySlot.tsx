'use client';

import { Card, Button } from '@/components/ui';
import { getRecipeById } from '@/data/recipes';
import { getDateForDayIndex } from '@/lib/dates';
import { MealType, Meal, Recipe } from '@/types';
import MealCard from './MealCard';

interface MealSlot {
  mealType: MealType;
  meals: Meal[];
}

interface DaySlotProps {
  dayName: string;
  dayIndex: number;
  isToday: boolean;
  startDay: number;
  weekStart?: string;
  slots: MealSlot[];
  userRecipes: Recipe[];
  onAddMeal?: (dayIndex: number, mealType: MealType, excludeRecipeIds: string[]) => void;
  onRemoveMeal?: (mealId: string) => void;
}

export default function DaySlot({
  dayName,
  dayIndex,
  isToday,
  startDay,
  weekStart,
  slots,
  userRecipes,
  onAddMeal,
  onRemoveMeal,
}: DaySlotProps) {
  return (
    <Card
      padding="none"
      data-testid={`day-${dayIndex}`}
      className={`scroll-mt-20 ${isToday ? 'border-2 border-primary' : ''}`}
    >
      <div className="sticky top-[56px] z-10 px-4 py-2 bg-background font-normal font-display text-base text-foreground rounded-t-2xl border-b border-border">
        <div className="flex items-center gap-2">
          {dayName}
          {isToday && (
            <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Today</span>
          )}
        </div>
        <div className="text-xs font-normal text-muted-foreground">
          {getDateForDayIndex(startDay, dayIndex, weekStart)}
        </div>
      </div>
      <div className="divide-y divide-border">
        {slots.map(({ mealType, meals }) => {
          const slotRecipeIds = meals.map(m => m.recipeId);

          return (
            <div key={mealType} data-testid={`slot-${dayIndex}-${mealType}`}>
              {/* Meal type header */}
              <div className="px-4 py-2 text-sm text-muted-foreground">
                <span className="uppercase tracking-wide">{mealType}</span>
              </div>

              {/* Meals in this slot */}
              {meals.length === 0 ? (
                <div className="px-4 pb-4 space-y-2">
                  <div className="p-3 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
                    No meals planned
                  </div>
                  {onAddMeal && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => onAddMeal(dayIndex, mealType, slotRecipeIds)}
                      data-testid={`add-meal-${dayIndex}-${mealType}`}
                      aria-label={`Add ${mealType}`}
                      className="w-full justify-start text-primary border-primary"
                    >
                      + Add
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {meals.map((meal) => {
                    const recipe = getRecipeById(meal.recipeId, userRecipes);
                    if (!recipe) return null;
                    return (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        recipe={recipe}
                        onRemove={onRemoveMeal}
                      />
                    );
                  })}
                  {/* Add button after existing meals */}
                  {onAddMeal && (
                    <div className="px-4 pb-4">
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => onAddMeal(dayIndex, mealType, slotRecipeIds)}
                        data-testid={`add-meal-${dayIndex}-${mealType}`}
                        aria-label={`Add ${mealType}`}
                        className="w-full justify-start text-primary"
                      >
                        + Add {mealType}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
