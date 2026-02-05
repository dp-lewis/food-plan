'use client';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  testId?: string;
}

export default function Stepper({ value, onChange, min = 1, max = 99, label, testId }: StepperProps) {
  const buttonStyles = {
    width: 'var(--touch-target-min)',
    height: 'var(--touch-target-min)',
    borderRadius: 'var(--border-radius-sm)',
    border: 'var(--border-width) solid var(--color-border)',
    background: 'var(--color-bg-primary)',
    fontSize: 'var(--font-size-heading)',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  };

  const valueStyles = {
    width: '3rem',
    textAlign: 'center' as const,
    fontSize: 'var(--font-size-heading)',
    fontWeight: 'var(--font-weight-bold)' as const,
  };

  const labelStyles = {
    display: 'block',
    marginBottom: 'var(--space-2)',
    fontSize: 'var(--font-size-body)',
    fontWeight: 'var(--font-weight-bold)' as const,
    color: 'var(--color-text-primary)',
  };

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
      {label && <label style={labelStyles}>{label}</label>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          style={{ ...buttonStyles, opacity: value <= min ? 0.5 : 1 }}
          aria-label={`Decrease ${label || 'value'}`}
          data-testid={testId ? `${testId}-decrement` : undefined}
        >
          −
        </button>
        <span
          style={valueStyles}
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
          style={{ ...buttonStyles, opacity: value >= max ? 0.5 : 1 }}
          aria-label={`Increase ${label || 'value'}`}
          data-testid={testId ? `${testId}-increment` : undefined}
        >
          +
        </button>
      </div>
    </div>
  );
}
