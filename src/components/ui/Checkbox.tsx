'use client';

import { ReactNode } from 'react';

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
  const buttonStyles = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-2) var(--space-1)',
    margin: '0 calc(var(--space-1) * -1)',
    borderRadius: 'var(--border-radius-sm)',
    minHeight: 'var(--touch-target-min)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
  };

  const checkboxStyles = {
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: 'var(--border-radius-sm)',
    border: `var(--border-width) solid ${checked ? 'var(--color-accent)' : 'var(--color-border)'}`,
    backgroundColor: checked ? 'var(--color-accent)' : 'transparent',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all var(--transition-fast)',
  };

  const labelStyles = {
    fontSize: 'var(--font-size-body)',
    color: checked ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
    textDecoration: checked && strikethrough ? 'line-through' : 'none',
    transition: 'all var(--transition-fast)',
  };

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      data-testid={id ? `checkbox-${id}` : undefined}
      style={buttonStyles}
    >
      <span style={checkboxStyles}>
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </span>
      <span style={labelStyles}>{children || label}</span>
    </button>
  );
}
