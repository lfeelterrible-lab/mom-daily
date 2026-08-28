import { useEffect } from 'react';

import { flushPendingSync } from '@/features/realtime/sync';
import { useMomDailyStore } from '@/store/useMomDailyStore';

export const useSyncQueue = () => {
  const isOnline = useMomDailyStore((state) => state.isOnline);
  const pendingSync = useMomDailyStore((state) => state.pendingSync);
  const removePendingSync = useMomDailyStore((state) => state.removePendingSync);

  useEffect(() => {
    if (!isOnline || pendingSync.length === 0) return;
    let cancelled = false;
    void flushPendingSync(pendingSync).then((ids) => {
      if (cancelled) return;
      ids.forEach((id) => removePendingSync(id));
    });
    return () => {
      cancelled = true;
    };
  }, [isOnline, pendingSync, removePendingSync]);
};

