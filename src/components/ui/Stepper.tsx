'use client';

import { cn } from '@/lib/utils';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  testId?: string;
}

export default function Stepper({ value, onChange, min = 1, max = 99, label, testId }: StepperProps) {
  const decrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const increment = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div>
      {label && <label className="block mb-2 text-base font-semibold text-foreground">{label}</label>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className={cn(
            'w-11 h-11 rounded-sm border border-border bg-background text-2xl text-foreground cursor-pointer transition-all',
            value <= min && 'opacity-50'
          )}
          aria-label={`Decrease ${label || 'value'}`}
          data-testid={testId ? `${testId}-decrement` : undefined}
        >
          −
        </button>
        <span
          className="w-12 text-center text-2xl font-semibold"
          data-testid={testId ? `${testId}-count` : 'stepper-value'}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {value}
        </span>
        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className={cn(
            'w-11 h-11 rounded-sm border border-border bg-background text-2xl text-foreground cursor-pointer transition-all',
            value >= max && 'opacity-50'
          )}
          aria-label={`Increase ${label || 'value'}`}
          data-testid={testId ? `${testId}-increment` : undefined}
        >
          +
        </button>
      </div>
    </div>
  );
}
