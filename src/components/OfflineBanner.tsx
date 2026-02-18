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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'var(--warning-light)',
        color: 'var(--warning)',
        textAlign: 'center',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        borderBottom: '1px solid var(--warning)',
      }}
    >
      You&apos;re offline &mdash; changes will sync when you reconnect.
    </div>
  );
}
