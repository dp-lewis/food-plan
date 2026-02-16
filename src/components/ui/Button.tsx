import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-default',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground border-none',
        secondary: 'bg-muted text-foreground border border-border',
        ghost: 'bg-transparent text-muted-foreground border-none',
      },
      size: {
        default: 'h-11 px-6 text-base',
        small: 'h-9 px-3 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, loading = false, className, children, ...props }, ref) => {
    const isDisabled = props.disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
        disabled={isDisabled}
        aria-busy={loading || undefined}
      >
        {loading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <span
              className="inline-block w-4 h-4 rounded-full border-2 border-transparent border-t-current border-r-current animate-spin flex-shrink-0"
              aria-hidden="true"
            />
            {children}
          </span>
        ) : children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
