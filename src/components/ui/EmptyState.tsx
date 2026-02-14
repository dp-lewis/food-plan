import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center p-8">
      {icon && (
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center text-[2rem]"
          role="presentation"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h2 className={cn('text-base font-semibold text-foreground', description ? 'mb-2' : 'mb-4')}>
        {title}
      </h2>
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
