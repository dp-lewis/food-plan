'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

export interface PageHeaderProps {
  title: string;
  backHref?: string;
  onBack?: () => void;
  sticky?: boolean;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  titleTestId?: string;
}

export default function PageHeader({
  title,
  backHref,
  onBack,
  sticky = false,
  actions,
  children,
  titleTestId,
}: PageHeaderProps) {
  const BackButton = backHref ? (
    <Link
      href={backHref}
      data-testid="page-header-back"
      className="p-1 -ml-1 rounded-md hover:bg-white/10 transition-colors"
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5" />
    </Link>
  ) : onBack ? (
    <button
      type="button"
      onClick={onBack}
      data-testid="page-header-back"
      className="p-1 -ml-1 rounded-md hover:bg-white/10 transition-colors"
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  ) : null;

  return (
    <header
      className={clsx(
        'bg-primary text-primary-foreground',
        sticky && 'sticky top-0 z-40'
      )}
    >
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          {BackButton}
          <h1 className="flex-1 text-lg font-semibold" data-testid={titleTestId}>{title}</h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </header>
  );
}
