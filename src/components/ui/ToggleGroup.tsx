'use client';

import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export interface ToggleOption {
  value: string;
  label: string;
}

export interface ToggleGroupProps {
  options: ToggleOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  label?: string;
  variant?: 'default' | 'compact';
  testIdPrefix?: string;
}

const toggleBaseVariants = cva(
  'rounded-sm border border-border bg-background text-base cursor-pointer transition-all h-11',
  {
    variants: {
      variant: {
        default: 'px-4 py-2',
        compact: 'w-11 font-semibold',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export default function ToggleGroup({
  options,
  value,
  onChange,
  multiple = false,
  label,
  variant = 'default',
  testIdPrefix,
}: ToggleGroupProps) {
  const selectedValues = Array.isArray(value) ? value : [value];

  const handleClick = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    } else {
      onChange(optionValue);
    }
  };

  const groupId = label ? `toggle-group-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined;

  return (
    <div>
      {label && (
        <label id={groupId} className="block mb-2 text-base font-semibold text-foreground">
          {label}
        </label>
      )}
      <div
        role="group"
        aria-labelledby={groupId}
        className="flex gap-2 flex-wrap"
      >
        {options.map((option) => {
          const isActive = selectedValues.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleClick(option.value)}
              className={cn(
                toggleBaseVariants({ variant }),
                isActive && variant === 'compact' && 'bg-primary border-primary text-primary-foreground',
                isActive && variant === 'default' && 'bg-[var(--color-accent-light)] border-primary text-primary',
              )}
              aria-pressed={isActive}
              data-testid={testIdPrefix ? `${testIdPrefix}-${option.value}` : undefined}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
