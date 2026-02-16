'use client';

import Link from 'next/link';
import { Card, ProgressBar } from '@/components/ui';

interface ShoppingStatus {
  total: number;
  checked: number;
}

interface ShoppingStatusCardProps {
  shoppingStatus: ShoppingStatus;
}

export default function ShoppingStatusCard({ shoppingStatus }: ShoppingStatusCardProps) {
  const isDone = shoppingStatus.checked >= shoppingStatus.total;

  return (
    <Link href="/shopping-list" data-testid="shopping-status-link">
      <Card className="mb-4" data-testid="shopping-status-card">
        {isDone ? (
          <p className="text-base text-muted-foreground">
            Shopping complete
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-semibold text-foreground">
                Shopping list
              </span>
              <span className="text-sm text-muted-foreground">
                {shoppingStatus.checked} of {shoppingStatus.total} items
              </span>
            </div>
            <ProgressBar
              value={shoppingStatus.checked}
              max={shoppingStatus.total}
              label={`Shopping progress: ${shoppingStatus.checked} of ${shoppingStatus.total} items`}
            />
          </>
        )}
      </Card>
    </Link>
  );
}
