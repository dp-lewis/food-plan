import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'small';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'default', className = '', children, ...props }, ref) => {
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
      cursor: props.disabled ? 'default' : 'pointer',
      opacity: props.disabled ? 0.5 : 1,
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

    return (
      <button
        ref={ref}
        className={className}
        style={{ ...baseStyles, ...variantStyles[variant] }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
