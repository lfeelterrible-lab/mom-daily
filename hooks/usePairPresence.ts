import type { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useMomDailyStore, type PairPresence } from '@/store/useMomDailyStore';

type PresenceMeta = {
  user_id?: string;
};

const getPresence = (channel: RealtimeChannel, userIds: { me: string; mom: string }): PairPresence => {
  const state = channel.presenceState() as Record<string, PresenceMeta[]>;
  const onlineIds = new Set<string>();

  Object.entries(state).forEach(([key, metas]) => {
    onlineIds.add(key);
    metas.forEach((meta) => {
      if (meta.user_id) onlineIds.add(meta.user_id);
    });
  });

  return {
    me: Boolean(userIds.me && onlineIds.has(userIds.me)),
    mom: Boolean(userIds.mom && onlineIds.has(userIds.mom)),
  };
};

export const usePairPresence = () => {
  const demoMode = useMomDailyStore((state) => state.demoMode);
  const pairId = useMomDailyStore((state) => state.pairId);
  const activeActor = useMomDailyStore((state) => state.activeActor);
  const userIds = useMomDailyStore((state) => state.userIds);
  const isOnline = useMomDailyStore((state) => state.isOnline);
  const setPairPresence = useMomDailyStore((state) => state.setPairPresence);

  useEffect(() => {
    if (demoMode) {
      setPairPresence({ me: true, mom: true });
      return undefined;
    }

    const client = supabase;
    const currentUserId = activeActor === 'me' ? userIds.me : userIds.mom;
    if (!client || !isSupabaseConfigured || !pairId || !currentUserId || !isOnline) {
      setPairPresence({ me: false, mom: false });
      return undefined;
    }

    let cancelled = false;
    const channel = client.channel('momdaily-presence-' + pairId, {
      config: { presence: { key: currentUserId } },
    });
    const updatePresence = () => {
      if (!cancelled) setPairPresence(getPresence(channel, userIds));
    };

    channel
      .on('presence', { event: 'sync' }, updatePresence)
      .on('presence', { event: 'join' }, updatePresence)
      .on('presence', { event: 'leave' }, updatePresence)
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED' || cancelled) return;
        void channel.track({
          user_id: currentUserId,
          actor: activeActor,
          online_at: new Date().toISOString(),
        });
        updatePresence();
      });

    return () => {
      cancelled = true;
      setPairPresence({ me: false, mom: false });
      void channel.untrack();
      void client.removeChannel(channel);
    };
  }, [activeActor, demoMode, isOnline, pairId, setPairPresence, userIds.me, userIds.mom]);
};
