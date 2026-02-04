import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
  padding?: 'none' | 'default' | 'large';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'default', className = '', children, style, ...props }, ref) => {
    const paddingValues = {
      none: '0',
      default: 'var(--space-4)',
      large: 'var(--space-6)',
    };

    const cardStyles = {
      backgroundColor: 'var(--color-bg-primary)',
      borderRadius: 'var(--border-radius-lg)',
      border: variant === 'default' ? 'var(--border-width) solid var(--color-border)' : 'none',
      boxShadow: variant === 'elevated' ? 'var(--shadow-md)' : 'none',
      padding: paddingValues[padding],
      ...style,
    };

    return (
      <div ref={ref} className={className} style={cardStyles} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
