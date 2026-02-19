'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  children?: ReactNode;
  strikethrough?: boolean;
  id?: string;
}

export default function Checkbox({
  checked,
  onChange,
  label,
  children,
  strikethrough = true,
  id,
}: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      data-testid={id ? `checkbox-${id}` : undefined}
      className="w-full flex items-center gap-3 py-2 px-1 -mx-1 rounded-sm h-11 bg-transparent border-none cursor-pointer text-left"
    >
      <span
        className={cn(
          'w-5 h-5 rounded-sm border flex-shrink-0 flex items-center justify-center transition-all',
          checked ? 'border-primary bg-primary' : 'border-border'
        )}
      >
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="var(--primary-foreground)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </span>
      <span
        className={cn(
          'text-base transition-all text-muted-foreground',
          checked && strikethrough && 'line-through'
        )}
      >
        {children || label}
      </span>
    </button>
  );
}
