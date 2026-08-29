import { useEffect } from 'react';

import { useLocalDate } from '@/hooks/useLocalDate';
import { actorForUserId } from '@/lib/pair';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useMomDailyStore, type Actor } from '@/store/useMomDailyStore';

export const useRealtimeCompletions = () => {
  const applyRemoteCompletion = useMomDailyStore((state) => state.applyRemoteCompletion);
  const pairId = useMomDailyStore((state) => state.pairId);
  const userIds = useMomDailyStore((state) => state.userIds);
  const demoMode = useMomDailyStore((state) => state.demoMode);
  const date = useLocalDate();

  useEffect(() => {
    const client = supabase;
    if (!client || !isSupabaseConfigured || demoMode) return undefined;

    const channel = client
      .channel('momdaily-pair-' + pairId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_completions',
          filter: 'pair_id=eq.' + pairId,
        },
        (payload) => {
          const record = (payload.eventType === 'DELETE' ? payload.old : payload.new) as {
            habit_id?: string;
            user_id?: string;
            date?: string;
          };
          if (!record.habit_id || !record.user_id) return;
          if (record.date && record.date !== date) return;
          const actor = actorForUserId(record.user_id, userIds);
          if (!actor) return;
          applyRemoteCompletion(record.habit_id, actor, payload.eventType !== 'DELETE', record.date ?? date);
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [applyRemoteCompletion, date, demoMode, pairId, userIds]);
};
