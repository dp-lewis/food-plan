'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/store';

/**
 * Exposes window.__setStoreState for Playwright e2e tests.
 * Only active outside of production.
 */
export function DevTestSeam() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__setStoreState = (partial: Record<string, unknown>) => {
      useStore.setState(partial as unknown as Parameters<typeof useStore.setState>[0]);
    };
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__setStoreState;
    };
  }, []);
  return null;
}
