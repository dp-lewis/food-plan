import { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const alertVariants = cva('px-3 py-2 rounded-md text-sm text-center', {
  variants: {
    variant: {
      error: 'bg-error-light text-error-foreground',
      success: 'bg-success-light text-success-foreground',
      warning: 'bg-warning-light text-warning-foreground',
      info: 'bg-info-light text-info-foreground',
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
