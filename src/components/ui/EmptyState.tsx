import { ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const containerStyles = {
    textAlign: 'center' as const,
    padding: 'var(--space-8)',
  };

  const iconContainerStyles = {
    width: '4rem',
    height: '4rem',
    margin: '0 auto var(--space-4)',
    borderRadius: '50%',
    backgroundColor: 'var(--color-accent-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
  };

  const titleStyles = {
    fontSize: 'var(--font-size-body)',
    fontWeight: 'var(--font-weight-bold)' as const,
    color: 'var(--color-text-primary)',
    marginBottom: description ? 'var(--space-2)' : 'var(--space-4)',
  };

  const descriptionStyles = {
    fontSize: 'var(--font-size-caption)',
    color: 'var(--color-text-muted)',
    marginBottom: 'var(--space-4)',
  };

  return (
    <div style={containerStyles}>
      {icon && (
        <div style={iconContainerStyles} role="presentation" aria-hidden="true">
          {icon}
        </div>
      )}
      <h2 style={titleStyles}>{title}</h2>
      {description && <p style={descriptionStyles}>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
