'use client';

import { useRouter } from 'next/navigation';
import { Card, Button, ProgressBar } from '@/components/ui';
import { ShoppingCart } from 'lucide-react';

interface ShoppingStatus {
  total: number;
  checked: number;
}

interface ShoppingStatusCardProps {
  shoppingStatus: ShoppingStatus;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <span className="bg-card px-4 text-xl font-normal text-foreground whitespace-nowrap font-display">
        {children}
      </span>
    </div>
  );
}

export default function ShoppingStatusCard({ shoppingStatus }: ShoppingStatusCardProps) {
  const router = useRouter();

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
        className="w-full justify-start h-auto py-4 px-4 rounded-[16px]"
        data-testid="shopping-status-link"
        onClick={() => router.push('/shopping-list')}
      >
        <ShoppingCart className="w-4 h-4 mr-2" aria-hidden="true" />
        View shopping list
      </Button>
    </Card>
  );
}
