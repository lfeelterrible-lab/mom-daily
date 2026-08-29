import { useEffect } from 'react';

import { useLocalDate } from '@/hooks/useLocalDate';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useMomDailyStore, type Actor, type Nudge, type QuickMessage, type Reaction } from '@/store/useMomDailyStore';

const actorForUserId = (userId: string, userIds: { me: string; mom: string }): Actor | null => {
  if (userId === userIds.me) return 'me';
  if (userId === userIds.mom) return 'mom';
  return null;
};

export const useRealtimeInteractions = () => {
  const activeActor = useMomDailyStore((state) => state.activeActor);
  const applyRemoteNudge = useMomDailyStore((state) => state.applyRemoteNudge);
  const applyRemoteReaction = useMomDailyStore((state) => state.applyRemoteReaction);
  const applyRemoteQuickMessage = useMomDailyStore((state) => state.applyRemoteQuickMessage);
  const pairId = useMomDailyStore((state) => state.pairId);
  const userIds = useMomDailyStore((state) => state.userIds);
  const demoMode = useMomDailyStore((state) => state.demoMode);
  const date = useLocalDate();

  useEffect(() => {
    const client = supabase;
    const currentUserId = userIds[activeActor];
    if (!client || !isSupabaseConfigured || demoMode || !pairId || !currentUserId) return undefined;

    const channel = client
      .channel('momdaily-interactions-' + pairId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nudges',
          filter: 'pair_id=eq.' + pairId,
        },
        (payload) => {
          const record = payload.new as {
            id?: string;
            habit_id?: string;
            from_user?: string;
            to_user?: string;
            date?: string;
            created_at?: string;
          };
          if (!record.id || !record.habit_id || !record.from_user || record.to_user !== currentUserId || record.date !== date) return;
          const from = actorForUserId(record.from_user, userIds);
          const to = actorForUserId(record.to_user, userIds);
          if (!from || !to || from === activeActor) return;
          const nudge: Nudge = {
            id: record.id,
            habitId: record.habit_id,
            from,
            to,
            date: record.date,
            createdAt: record.created_at ?? new Date().toISOString(),
          };
          applyRemoteNudge(nudge);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
          filter: 'pair_id=eq.' + pairId,
        },
        (payload) => {
          const record = payload.new as {
            id?: string;
            habit_id?: string;
            from_user?: string;
            to_user?: string;
            emoji?: string;
            date?: string;
            created_at?: string;
          };
          if (!record.id || !record.habit_id || !record.from_user || !record.emoji || record.to_user !== currentUserId || record.date !== date) return;
          const from = actorForUserId(record.from_user, userIds);
          const to = actorForUserId(record.to_user, userIds);
          if (!from || !to || from === activeActor) return;
          const reaction: Reaction = {
            id: record.id,
            habitId: record.habit_id,
            from,
            to,
            emoji: record.emoji,
            date: record.date,
            createdAt: record.created_at ?? new Date().toISOString(),
          };
          applyRemoteReaction(reaction);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quick_messages',
          filter: 'pair_id=eq.' + pairId,
        },
        (payload) => {
          const record = payload.new as {
            id?: string;
            pair_id?: string;
            from_user?: string;
            to_user?: string;
            content?: string;
            date?: string;
            created_at?: string;
          };
          if (!record.id || !record.from_user || !record.content || record.to_user !== currentUserId || record.date !== date) return;
          const from = actorForUserId(record.from_user, userIds);
          const to = actorForUserId(record.to_user, userIds);
          if (!from || !to || from === activeActor) return;
          const message: QuickMessage = {
            id: record.id,
            pairId,
            from,
            to,
            content: record.content,
            date: record.date,
            createdAt: record.created_at ?? new Date().toISOString(),
          };
          applyRemoteQuickMessage(message);
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [activeActor, applyRemoteNudge, applyRemoteQuickMessage, applyRemoteReaction, date, demoMode, pairId, userIds]);
};
