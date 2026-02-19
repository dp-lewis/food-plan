'use client';

import { useStore } from '@/store/store';

/**
 * Displays a fixed banner at the top of the viewport when the app is offline.
 * Reads _isOnline from the Zustand store and renders nothing when online.
 */
export function OfflineBanner() {
  const isOnline = useStore((state) => state._isOnline);

  if (isOnline) return null;

  return (
    <div
      data-testid="offline-banner"
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9999] bg-warning-light text-warning-foreground text-center px-4 py-2 text-sm font-medium border-b border-warning"
    >
      You&apos;re offline &mdash; changes will sync when you reconnect.
    </div>
  );
}
