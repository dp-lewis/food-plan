import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'small';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'default', loading = false, className = '', children, ...props }, ref) => {
    const isDisabled = props.disabled || loading;

    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--border-radius-sm)',
      fontWeight: 'var(--font-weight-bold)' as const,
      transition: 'all var(--transition-fast)',
      minHeight: size === 'small' ? '36px' : 'var(--touch-target-min)',
      padding: size === 'small' ? 'var(--space-2) var(--space-3)' : 'var(--space-3) var(--space-6)',
      fontSize: size === 'small' ? 'var(--font-size-caption)' : 'var(--font-size-body)',
      cursor: isDisabled ? 'default' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
    };

    const variantStyles = {
      primary: {
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-text-inverse)',
        border: 'none',
      },
      secondary: {
        backgroundColor: 'var(--color-bg-tertiary)',
        color: 'var(--color-text-primary)',
        border: 'var(--border-width) solid var(--color-border)',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--color-text-muted)',
        border: 'none',
      },
    };

    const spinnerStyle: React.CSSProperties = {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      border: '2px solid transparent',
      borderTopColor: 'currentColor',
      borderRightColor: 'currentColor',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    };

    return (
      <button
        ref={ref}
        className={className}
        style={{ ...baseStyles, ...variantStyles[variant] }}
        {...props}
        disabled={isDisabled}
      >
        {loading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={spinnerStyle} aria-hidden="true" />
            {children}
          </span>
        ) : children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
