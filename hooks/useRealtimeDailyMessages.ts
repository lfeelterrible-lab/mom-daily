import { useEffect } from 'react';

import { useLocalDate } from '@/hooks/useLocalDate';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useMomDailyStore, type Actor } from '@/store/useMomDailyStore';

const actorForUserId = (userId: string, userIds: { me: string; mom: string }): Actor | null => {
  if (userId === userIds.me) return 'me';
  if (userId === userIds.mom) return 'mom';
  return null;
};

export const useRealtimeDailyMessages = () => {
  const applyRemoteDailyMessage = useMomDailyStore((state) => state.applyRemoteDailyMessage);
  const pairId = useMomDailyStore((state) => state.pairId);
  const userIds = useMomDailyStore((state) => state.userIds);
  const demoMode = useMomDailyStore((state) => state.demoMode);
  const date = useLocalDate();

  useEffect(() => {
    const client = supabase;
    if (!client || !isSupabaseConfigured || demoMode || !pairId) return undefined;

    const channel = client
      .channel('momdaily-messages-' + pairId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_messages',
          filter: 'pair_id=eq.' + pairId,
        },
        (payload) => {
          const record = (payload.eventType === 'DELETE' ? payload.old : payload.new) as {
            user_id?: string;
            date?: string;
            content?: string;
            updated_at?: string;
          };
          if (!record.user_id || !record.date || record.date !== date) return;
          const actor = actorForUserId(record.user_id, userIds);
          if (!actor) return;
          applyRemoteDailyMessage(actor, payload.eventType === 'DELETE' ? '' : record.content ?? '', record.date, record.updated_at);
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [applyRemoteDailyMessage, date, demoMode, pairId, userIds]);
};
