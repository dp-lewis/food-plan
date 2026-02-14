import { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const alertVariants = cva('px-3 py-2 rounded-md text-sm text-center', {
  variants: {
    variant: {
      error: 'bg-[var(--color-error-light)] text-destructive',
      success: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
      warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
      info: 'bg-[var(--color-info-light)] text-[var(--color-info)]',
    },
  },
  defaultVariants: { variant: 'error' },
});

export interface AlertProps extends VariantProps<typeof alertVariants> {
  children: ReactNode;
  className?: string;
}

export default function Alert({ variant, className, children }: AlertProps) {
  return (
    <p role="alert" className={cn(alertVariants({ variant }), className)}>
      {children}
    </p>
  );
}
