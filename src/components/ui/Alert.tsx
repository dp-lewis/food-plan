import { ReactNode } from 'react';

export interface AlertProps {
  variant?: 'error' | 'success' | 'warning' | 'info';
  children: ReactNode;
}

export default function Alert({ variant = 'error', children }: AlertProps) {
  const variantStyles = {
    error: {
      backgroundColor: 'var(--color-error-light)',
      color: 'var(--color-error)',
    },
    success: {
      backgroundColor: 'var(--color-success-light)',
      color: 'var(--color-success)',
    },
    warning: {
      backgroundColor: 'var(--color-warning-light)',
      color: 'var(--color-warning)',
    },
    info: {
      backgroundColor: 'var(--color-info-light)',
      color: 'var(--color-info)',
    },
  };

  const baseStyles = {
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--font-size-caption)',
    textAlign: 'center' as const,
    ...variantStyles[variant],
  };

  return (
    <p role="alert" style={baseStyles}>
      {children}
    </p>
  );
}
