'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, ShoppingCart, BookOpen, Plus, MapPin, LinkIcon } from 'lucide-react';
import { clsx } from 'clsx';

export interface BottomNavProps {
  onTodayClick?: () => void;
  onAddItemClick?: () => void;
  onImportClick?: () => void;
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
  onTodayClick,
  onAddItemClick,
  onImportClick,
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
  } else if (pathname === '/plan/current') {
    if (onTodayClick) {
      primaryAction = {
        icon: MapPin,
        label: 'Today',
        testId: 'bottom-nav-primary',
        onClick: onTodayClick,
      };
    }
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
  }

  return (
    <nav
      aria-label="Main navigation"
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-20"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="max-w-2xl mx-auto flex items-center">
        {/* Tab buttons */}
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-testid={`tab-${tab.label.toLowerCase()}`}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors',
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

        {/* Primary action button */}
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            data-testid={primaryAction.testId}
            className="flex flex-col items-center gap-1 py-2 px-4 text-xs bg-primary text-primary-foreground rounded-lg font-semibold transition-colors hover:bg-primary/90"
          >
            <primaryAction.icon className="w-5 h-5" />
            <span>{primaryAction.label}</span>
          </button>
        )}
      </div>
    </nav>
  );
}
