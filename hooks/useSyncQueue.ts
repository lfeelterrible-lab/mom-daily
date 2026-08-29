import { useCallback, useEffect, useRef } from 'react';

import { flushPendingSync } from '@/features/realtime/sync';
import { useMomDailyStore } from '@/store/useMomDailyStore';

export const useSyncQueue = () => {
  const isOnline = useMomDailyStore((state) => state.isOnline);
  const pendingCount = useMomDailyStore((state) => state.pendingSync.length);
  const removePendingSync = useMomDailyStore((state) => state.removePendingSync);
  const flushing = useRef(false);
  const mounted = useRef(true);

  useEffect(() => () => {
    mounted.current = false;
  }, []);

  const runFlush = useCallback(async () => {
    if (flushing.current || !mounted.current) return;
    flushing.current = true;
    let progressed = false;

    try {
      while (mounted.current && useMomDailyStore.getState().isOnline) {
        const operations = useMomDailyStore.getState().pendingSync;
        if (operations.length === 0) break;
        const ids = await flushPendingSync(operations);
        if (ids.length === 0) break;
        progressed = true;
        ids.forEach((id) => removePendingSync(id));
      }
    } catch {
      // Keep the queue intact; the next online transition can retry it.
    } finally {
      flushing.current = false;
      const hasRemaining = useMomDailyStore.getState().pendingSync.length > 0;
      if (progressed && hasRemaining && useMomDailyStore.getState().isOnline) {
        setTimeout(() => void runFlush(), 0);
      }
    }
  }, [removePendingSync]);

  useEffect(() => {
    if (isOnline && pendingCount > 0) void runFlush();
  }, [isOnline, pendingCount, runFlush]);
};
