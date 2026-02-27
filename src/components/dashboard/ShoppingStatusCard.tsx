'use client';

import { useRouter } from 'next/navigation';
import { Card, Button, ProgressBar } from '@/components/ui';
import { ShoppingCart } from 'lucide-react';
import SectionHeading from './SectionHeading';

interface ShoppingStatus {
  total: number;
  checked: number;
}

interface ShoppingStatusCardProps {
  shoppingStatus: ShoppingStatus;
}

function getProgressCommentary(checked: number, total: number): string | null {
  if (total === 0) return null;
  const pct = checked / total;
  if (pct === 0) return 'Ready to start shopping';
  if (pct === 1) return 'All done — great work!';
  if (pct >= 0.9) return 'Nearly there now';
  if (pct >= 0.75) return 'Almost there';
  if (pct >= 0.5) return 'More than half way';
  if (pct >= 0.45) return 'Almost half way';
  if (pct >= 0.25) return 'Making good progress';
  return 'Just getting started';
}

export default function ShoppingStatusCard({ shoppingStatus }: ShoppingStatusCardProps) {
  const router = useRouter();
  const commentary = getProgressCommentary(shoppingStatus.checked, shoppingStatus.total);

  return (
    <Card data-testid="shopping-status-card" className="relative pt-8">
      <SectionHeading>Shopping list</SectionHeading>

      {/* Large number display */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-4xl font-normal text-foreground font-display" data-testid="shopping-status-count">
          {shoppingStatus.checked}/{shoppingStatus.total}
        </span>
        <span className="text-base text-muted-foreground">items</span>
      </div>

      {/* Progress bar with orange-red color */}
      <div className="mb-2">
        <ProgressBar
          value={shoppingStatus.checked}
          max={shoppingStatus.total}
          colorVar="var(--progress-shopping)"
          label={`Shopping progress: ${shoppingStatus.checked} of ${shoppingStatus.total} items`}
        />
      </div>

      {/* Progress commentary */}
      {commentary && (
        <p className="text-sm text-muted-foreground mb-4">{commentary}</p>
      )}

      {/* CTA button */}
      <Button
        variant="primary"
        className="w-full justify-start h-auto py-4 px-4 rounded-2xl"
        data-testid="shopping-status-link"
        onClick={() => router.push('/shopping-list')}
      >
        <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />
        View shopping list
      </Button>
    </Card>
  );
}
