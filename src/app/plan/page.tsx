'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, defaultPreferences } from '@/store/store';
import { createEmptyPlan } from '@/lib/planGenerator';
import { MealPlanPreferences } from '@/types';
import { ToggleGroup, Button, PageHeader } from '@/components/ui';

const DAY_OPTIONS = [
  { value: '0', label: 'Mon' },
  { value: '1', label: 'Tue' },
  { value: '2', label: 'Wed' },
  { value: '3', label: 'Thu' },
  { value: '4', label: 'Fri' },
  { value: '5', label: 'Sat' },
  { value: '6', label: 'Sun' },
];

export default function CreatePlan() {
  const router = useRouter();
  const setCurrentPlan = useStore((state) => state.setCurrentPlan);

  const [preferences, setPreferences] = useState<MealPlanPreferences>(defaultPreferences);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plan = createEmptyPlan(preferences);
    setCurrentPlan(plan);
    router.push('/plan/current');
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="New Plan" backHref="/" />
      <main id="main-content" className="max-w-md mx-auto px-4 py-6 pb-6 space-y-6">
        <p className="text-base text-muted-foreground">
          Pick the day your week starts and we&apos;ll set up a blank week for you to fill.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <ToggleGroup
            label="Week starts on"
            options={DAY_OPTIONS}
            value={String(preferences.startDay)}
            onChange={(value) =>
              setPreferences((p) => ({ ...p, startDay: Number(value) }))
            }
            variant="compact"
            testIdPrefix="day"
          />

          <Button type="submit" className="w-full" data-testid="generate-plan-btn">
            Start Planning
          </Button>
        </form>
      </main>
    </div>
  );
}
