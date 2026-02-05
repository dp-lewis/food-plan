'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ActionConfig {
  href?: string;
  onClick?: () => void;
  label: string;
  testId?: string;
}

export interface BottomNavProps {
  backHref?: string;
  backLabel?: string;
  showBack?: boolean;
  secondaryAction?: ActionConfig;
  primaryAction?: ActionConfig;
  maxWidth?: 'md' | '2xl';
}

export default function BottomNav({
  backHref,
  backLabel = 'Back',
  showBack = true,
  secondaryAction,
  primaryAction,
  maxWidth = 'md',
}: BottomNavProps) {
  const router = useRouter();

  if (!showBack && !primaryAction && !secondaryAction) {
    return null;
  }

  const containerMaxWidth = maxWidth === '2xl' ? 'max-w-2xl' : 'max-w-md';

  const backButtonStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    minHeight: 'var(--touch-target-min)',
    padding: 'var(--space-2) var(--space-3)',
    fontSize: 'var(--font-size-body)',
    fontWeight: 'var(--font-weight-bold)' as React.CSSProperties['fontWeight'],
    color: 'var(--color-text-secondary)',
    background: 'none',
    border: 'none',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
  };

  const BackElement = showBack ? (
    backHref ? (
      <Link href={backHref} style={backButtonStyles} data-testid="bottom-nav-back">
        <span aria-hidden="true">←</span>
        {backLabel}
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => router.back()}
        style={backButtonStyles}
        data-testid="bottom-nav-back"
      >
        <span aria-hidden="true">←</span>
        {backLabel}
      </button>
    )
  ) : null;

  const secondaryButtonStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-3) var(--space-6)',
    fontSize: 'var(--font-size-body)',
    fontWeight: 'var(--font-weight-bold)' as React.CSSProperties['fontWeight'],
    minHeight: 'var(--touch-target-min)',
    borderRadius: 'var(--border-radius-sm)',
    border: 'var(--border-width) solid var(--color-border)',
    backgroundColor: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
  };

  const SecondaryElement = secondaryAction ? (
    secondaryAction.href ? (
      <Link
        href={secondaryAction.href}
        style={secondaryButtonStyles}
        data-testid={secondaryAction.testId || 'bottom-nav-secondary'}
      >
        {secondaryAction.label}
      </Link>
    ) : (
      <button
        type="button"
        onClick={secondaryAction.onClick}
        style={secondaryButtonStyles}
        data-testid={secondaryAction.testId || 'bottom-nav-secondary'}
      >
        {secondaryAction.label}
      </button>
    )
  ) : null;

  const PrimaryElement = primaryAction ? (
    primaryAction.href ? (
      <Link
        href={primaryAction.href}
        className="primary-button"
        data-testid={primaryAction.testId || 'bottom-nav-primary'}
      >
        {primaryAction.label}
      </Link>
    ) : (
      <button
        type="button"
        onClick={primaryAction.onClick}
        className="primary-button"
        data-testid={primaryAction.testId || 'bottom-nav-primary'}
      >
        {primaryAction.label}
      </button>
    )
  ) : null;

  const hasActions = primaryAction || secondaryAction;

  return (
    <nav
      aria-label="Page navigation"
      className="fixed bottom-0 left-0 right-0"
      style={{
        padding: 'var(--space-4)',
        backgroundColor: 'var(--color-bg-primary)',
        borderTop: 'var(--border-width) solid var(--color-border)',
        zIndex: 'var(--z-sticky)',
      }}
    >
      <div className={`${containerMaxWidth} mx-auto flex items-center ${hasActions ? 'justify-between' : 'justify-start'} gap-3`}>
        {BackElement}
        {hasActions && (
          <div className="flex gap-2">
            {SecondaryElement}
            {PrimaryElement}
          </div>
        )}
      </div>
    </nav>
  );
}
