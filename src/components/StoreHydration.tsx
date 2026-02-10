'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/store';

/**
 * Triggers Zustand persist rehydration from localStorage on the client.
 *
 * This component must be rendered in the layout so that the persisted state
 * is loaded before any page component tries to read it. Without this,
 * Next.js static pages render with the Zustand defaults (e.g. currentPlan = null)
 * and effects that redirect based on state fire before localStorage is read.
 */
export function StoreHydration() {
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);

  return null;
}
