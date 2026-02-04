import { ReactNode } from 'react';

export interface AlertProps {
  variant?: 'error' | 'success' | 'warning' | 'info';
  children: ReactNode;
}

export default function Alert({ variant = 'error', children }: AlertProps) {
  const variantStyles = {
    error: {
      backgroundColor: 'var(--color-error-light, #fee2e2)',
      color: 'var(--color-error, #dc2626)',
    },
    success: {
      backgroundColor: 'var(--color-success-light, #dcfce7)',
      color: 'var(--color-success, #16a34a)',
    },
    warning: {
      backgroundColor: 'var(--color-warning-light, #fef3c7)',
      color: 'var(--color-warning, #d97706)',
    },
    info: {
      backgroundColor: 'var(--color-info-light, #dbeafe)',
      color: 'var(--color-info, #2563eb)',
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
