'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  message: string | null;
  variant?: 'success' | 'error';
  /** Duration in ms before auto-dismissing. Default: 3000 */
  duration?: number;
  onDismiss?: () => void;
}

export default function Toast({
  message,
  variant = 'success',
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="toast"
      className={cn(
        'fixed bottom-24 left-1/2 -translate-x-1/2 z-50',
        'px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium',
        'transition-all duration-200',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        variant === 'success'
          ? 'bg-success text-success-foreground'
          : 'bg-error text-error-foreground',
      )}
    >
      {message}
    </div>
  );
}
