'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button';
import { LucideIcon } from 'lucide-react';

export interface PrimaryAction {
  href: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
}

interface QuickActionsProps {
  primaryAction: PrimaryAction;
  todayIndex: number;
}

export default function QuickActions({ primaryAction, todayIndex }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <Link
        href={primaryAction.href}
        data-testid="primary-action-link"
        className={buttonVariants({ variant: 'primary' }) + ' w-full h-auto py-4 justify-start text-left'}
      >
        <primaryAction.icon className="w-5 h-5 mr-3 flex-shrink-0" />
        <div>
          <div className="font-semibold">{primaryAction.label}</div>
          <div className="text-sm font-normal opacity-70">{primaryAction.subtitle}</div>
        </div>
      </Link>
      <Link
        href="/plan/current"
        data-testid="view-full-plan-link"
        className={buttonVariants({ variant: 'secondary' }) + ' w-full h-auto py-4 justify-start text-left'}
      >
        <Calendar className="w-5 h-5 mr-3 flex-shrink-0" />
        <div>
          <div className="font-semibold">Full Plan</div>
          <div className="text-sm font-normal opacity-70">Day {todayIndex + 1} of 7</div>
        </div>
      </Link>
    </div>
  );
}
