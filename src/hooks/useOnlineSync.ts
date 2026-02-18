'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/store';

/**
 * Sets up online/offline detection and syncs the queue on reconnect.
 *
 * - Sets initial online state from navigator.onLine on mount.
 * - Listens for window 'online' and 'offline' events.
 * - On 'online': marks the store as online and triggers a queue drain by
 *   updating _isOnline, which causes the syncSubscriber to fire and process
 *   any intents that were queued while offline.
 * - On 'offline': marks the store as offline so the syncSubscriber stops
 *   draining and intents accumulate in the persisted queue.
 * - Cleans up event listeners on unmount.
 */
export function useOnlineSync(): void {
  const _setIsOnline = useStore((state) => state._setIsOnline);

  useEffect(() => {
    // Set the initial state based on the browser's current connectivity.
    _setIsOnline(navigator.onLine);

    function handleOnline(): void {
      // Setting online=true triggers the syncSubscriber (which subscribes to
      // all store changes) to drain the queued intents.
      _setIsOnline(true);
    }

    function handleOffline(): void {
      _setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [_setIsOnline]);
}
