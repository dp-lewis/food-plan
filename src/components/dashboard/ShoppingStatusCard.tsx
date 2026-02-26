'use client';

import { useRouter } from 'next/navigation';
import { Card, Button, ProgressBar } from '@/components/ui';
import { Calendar } from 'lucide-react';

interface ShoppingStatus {
  total: number;
  checked: number;
}

interface ShoppingStatusCardProps {
  shoppingStatus: ShoppingStatus;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-base font-semibold text-foreground">{children}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function ShoppingStatusCard({ shoppingStatus }: ShoppingStatusCardProps) {
  const router = useRouter();

  return (
    <Card data-testid="shopping-status-card" className="mb-4">
      <SectionHeading>Shopping list</SectionHeading>

      {/* Large number display */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-4xl font-bold text-foreground" data-testid="shopping-status-count">
          {shoppingStatus.checked}/{shoppingStatus.total}
        </span>
        <span className="text-base text-muted-foreground">items</span>
      </div>

      {/* Progress bar with orange-red color */}
      <div className="mb-4">
        <ProgressBar
          value={shoppingStatus.checked}
          max={shoppingStatus.total}
          colorVar="var(--progress-shopping)"
          label={`Shopping progress: ${shoppingStatus.checked} of ${shoppingStatus.total} items`}
        />
      </div>

      {/* CTA button */}
      <Button
        variant="primary"
        className="w-full"
        data-testid="shopping-status-link"
        onClick={() => router.push('/shopping-list')}
      >
        <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
        View shopping list
      </Button>
    </Card>
  );
}
