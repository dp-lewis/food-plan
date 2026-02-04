import { SelectHTMLAttributes, forwardRef, useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, onChange, id: providedId, className = '', ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    const selectStyles = {
      width: '100%',
      padding: 'var(--space-2) var(--space-3)',
      borderRadius: 'var(--border-radius-sm)',
      backgroundColor: 'var(--color-bg-primary)',
      border: 'var(--border-width) solid var(--color-border)',
      fontSize: 'var(--font-size-body)',
      color: 'var(--color-text-primary)',
      cursor: 'pointer',
    };

    const labelStyles = {
      display: 'block',
      marginBottom: 'var(--space-1)',
      fontSize: 'var(--font-size-caption)',
      fontWeight: 'var(--font-weight-bold)' as const,
      color: 'var(--color-text-primary)',
    };

    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} style={labelStyles}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          style={selectStyles}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
