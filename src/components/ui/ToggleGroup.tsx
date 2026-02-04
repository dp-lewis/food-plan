'use client';

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
}

export default function ToggleGroup({
  options,
  value,
  onChange,
  multiple = false,
  label,
  variant = 'default',
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

  const labelStyles = {
    display: 'block',
    marginBottom: 'var(--space-2)',
    fontSize: 'var(--font-size-body)',
    fontWeight: 'var(--font-weight-bold)' as const,
    color: 'var(--color-text-primary)',
  };

  const buttonBaseStyles = {
    borderRadius: 'var(--border-radius-sm)',
    border: 'var(--border-width) solid var(--color-border)',
    background: 'var(--color-bg-primary)',
    fontSize: 'var(--font-size-body)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    minHeight: 'var(--touch-target-min)',
  };

  const compactStyles = {
    width: 'var(--touch-target-min)',
    height: 'var(--touch-target-min)',
    fontWeight: 'var(--font-weight-bold)' as const,
  };

  const defaultStyles = {
    padding: 'var(--space-2) var(--space-4)',
  };

  const activeStyles = {
    background: variant === 'compact' ? 'var(--color-accent)' : 'var(--color-accent-light)',
    borderColor: 'var(--color-accent)',
    color: variant === 'compact' ? 'var(--color-text-inverse)' : 'var(--color-accent)',
  };

  return (
    <div>
      {label && <label style={labelStyles}>{label}</label>}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {options.map((option) => {
          const isActive = selectedValues.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleClick(option.value)}
              style={{
                ...buttonBaseStyles,
                ...(variant === 'compact' ? compactStyles : defaultStyles),
                ...(isActive ? activeStyles : {}),
              }}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
