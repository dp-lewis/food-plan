import { InputHTMLAttributes, forwardRef, useId } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  onChange?: (value: string) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, onChange, id: providedId, className = '', ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;

    const inputStyles = {
      width: '100%',
      padding: 'var(--space-2) var(--space-3)',
      borderRadius: 'var(--border-radius-sm)',
      backgroundColor: 'var(--color-bg-primary)',
      border: `var(--border-width) solid ${error ? 'var(--color-error, #c00)' : 'var(--color-border)'}`,
      fontSize: 'var(--font-size-body)',
      color: 'var(--color-text-primary)',
    };

    const labelStyles = {
      display: 'block',
      marginBottom: 'var(--space-1)',
      fontSize: 'var(--font-size-caption)',
      fontWeight: 'var(--font-weight-bold)' as const,
      color: 'var(--color-text-primary)',
    };

    const errorStyles = {
      marginTop: 'var(--space-1)',
      fontSize: 'var(--font-size-caption)',
      color: 'var(--color-error, #c00)',
    };

    return (
      <div className={className}>
        {label && (
          <label htmlFor={id} style={labelStyles}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          style={inputStyles}
          onChange={(e) => onChange?.(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} role="alert" style={errorStyles}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
