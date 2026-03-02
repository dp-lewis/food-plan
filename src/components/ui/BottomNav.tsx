'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, ShoppingCart, BookOpen, Plus, MapPin, LinkIcon, Share2 } from 'lucide-react';
import { clsx } from 'clsx';

export interface BottomNavProps {
  onAddItemClick?: () => void;
  onImportClick?: () => void;
  onShareClick?: () => void;
  hideFab?: boolean;
}

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/plan/current', label: 'Plan', icon: Calendar },
  { href: '/shopping-list', label: 'Shopping', icon: ShoppingCart },
  { href: '/recipes', label: 'Recipes', icon: BookOpen },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export default function BottomNav({
  onAddItemClick,
  onImportClick,
  onShareClick,
  hideFab,
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine route-aware primary action
  let primaryAction: {
    icon: typeof Plus;
    label: string;
    testId: string;
    onClick: () => void;
  } | null = null;

  if (pathname === '/') {
    primaryAction = {
      icon: Plus,
      label: 'New Plan',
      testId: 'new-plan-link',
      onClick: () => router.push('/plan'),
    };
  } else if (pathname === '/shopping-list') {
    if (onAddItemClick) {
      primaryAction = {
        icon: Plus,
        label: 'Add Item',
        testId: 'open-add-drawer-btn',
        onClick: onAddItemClick,
      };
    }
  } else if (pathname === '/recipes') {
    if (onImportClick) {
      primaryAction = {
        icon: LinkIcon,
        label: 'Import',
        testId: 'import-recipe-btn',
        onClick: onImportClick,
      };
    }
  } else if (pathname === '/plan/current') {
    if (onShareClick) {
      primaryAction = {
        icon: Share2,
        label: 'Share',
        testId: 'share-plan-btn',
        onClick: onShareClick,
      };
    }
  }

  return (
    <>
      {/* Floating Action Button (FAB) - positioned above the nav */}
      {primaryAction && !hideFab && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          data-testid={primaryAction.testId}
          aria-label={primaryAction.label}
          className="fixed bottom-[calc(5rem+28px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 min-h-11 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:shadow-xl flex items-center justify-center gap-2 z-30 pointer-events-auto"
        >
          <primaryAction.icon className="w-5 h-5" />
          <span className="font-semibold text-sm whitespace-nowrap">{primaryAction.label}</span>
        </button>
      )}

      <nav
        aria-label="Main navigation"
        data-testid="bottom-nav"
        className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-20 px-2 pt-2 pb-3 pointer-events-none"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="max-w-2xl mx-auto relative">
          {/* Tab buttons - fixed max-width container to stay centered on wider screens */}
          <div className="flex items-center justify-center px-4">
            <div className="max-w-xs w-full flex items-center justify-center gap-2">
            {TABS.map((tab) => {
              const active = isActive(pathname, tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  data-testid={`tab-${tab.label.toLowerCase()}`}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors pointer-events-auto',
                    active
                      ? 'text-primary font-semibold bg-primary/10 rounded-lg'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
