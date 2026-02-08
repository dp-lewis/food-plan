'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, defaultPreferences } from '@/store/store';
import { createEmptyPlan } from '@/lib/planGenerator';
import { MealPlanPreferences } from '@/types';
import { BottomNav, ToggleGroup, Button } from '@/components/ui';

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
    <main id="main-content" className="min-h-screen p-4 pb-20">
      <div className="max-w-md mx-auto">

        <h1
          className="mb-2"
          style={{
            fontSize: 'var(--font-size-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)',
          }}
        >
          Start a New Plan
        </h1>

        <p
          className="mb-6"
          style={{
            fontSize: 'var(--font-size-body)',
            color: 'var(--color-text-muted)',
          }}
        >
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
      </div>

      <BottomNav backHref="/" />
    </main>
  );
}
