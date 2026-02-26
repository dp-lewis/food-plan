import { HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const cardVariants = cva('bg-card rounded-2xl', {
  variants: {
    variant: {
      default: 'border border-border',
      elevated: 'shadow-md border-none',
    },
    padding: {
      none: 'p-0',
      default: 'p-4',
      large: 'p-6',
    },
  },
  defaultVariants: { variant: 'default', padding: 'default' },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant, padding, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(cardVariants({ variant, padding }), className)} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
