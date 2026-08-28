import type { Nudge, Reaction } from '@/store/useMomDailyStore';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type CompletionSyncPayload = {
  habitId: string;
  userId: string;
  pairId: string;
  date: string;
  completed: boolean;
};

export const syncCompletionToSupabase = async (payload: CompletionSyncPayload) => {
  if (!supabase || !isSupabaseConfigured) return false;

  if (payload.completed) {
    const { error } = await supabase.from('daily_completions').upsert(
      {
        pair_id: payload.pairId,
        habit_id: payload.habitId,
        user_id: payload.userId,
        date: payload.date,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'pair_id,habit_id,user_id,date' },
    );
    if (error) console.warn('[MomDaily] completion sync failed', error.message);
    return !error;
  }

  const { error } = await supabase
    .from('daily_completions')
    .delete()
    .eq('pair_id', payload.pairId)
    .eq('habit_id', payload.habitId)
    .eq('user_id', payload.userId)
    .eq('date', payload.date);
  if (error) console.warn('[MomDaily] completion delete failed', error.message);
  return !error;
};

export const syncNudgeToSupabase = async (nudge: Pick<Nudge, 'habitId' | 'date'>, fromUser: string, toUser: string, pairId: string) => {
  if (!supabase || !isSupabaseConfigured) return false;
  const { error } = await supabase.from('nudges').insert({
    pair_id: pairId,
    habit_id: nudge.habitId,
    from_user: fromUser,
    to_user: toUser,
    date: nudge.date,
  });
  if (error) console.warn('[MomDaily] nudge sync failed', error.message);
  return !error;
};

export const syncReactionToSupabase = async (reaction: Pick<Reaction, 'habitId' | 'emoji' | 'date'>, fromUser: string, toUser: string, pairId: string) => {
  if (!supabase || !isSupabaseConfigured) return false;
  const { error } = await supabase.from('reactions').insert({
    pair_id: pairId,
    habit_id: reaction.habitId,
    from_user: fromUser,
    to_user: toUser,
    emoji: reaction.emoji,
    date: reaction.date,
  });
  if (error) console.warn('[MomDaily] reaction sync failed', error.message);
  return !error;
};

export const flushPendingSync = async (
  operations: Array<{ id: string; type: 'completion' | 'nudge' | 'reaction'; payload: Record<string, string | boolean> }>,
) => {
  if (!supabase || !isSupabaseConfigured) return [];

  const syncedIds: string[] = [];
  for (const operation of operations) {
    let synced = false;
    if (operation.type === 'completion') {
      synced = await syncCompletionToSupabase({
        habitId: String(operation.payload.habitId),
        userId: String(operation.payload.userId),
        pairId: String(operation.payload.pairId),
        date: String(operation.payload.date),
        completed: Boolean(operation.payload.completed),
      });
    } else if (operation.type === 'nudge') {
      synced = await syncNudgeToSupabase(
        { habitId: String(operation.payload.habitId), date: String(operation.payload.date) },
        String(operation.payload.fromUser),
        String(operation.payload.toUser),
        String(operation.payload.pairId),
      );
    } else {
      synced = await syncReactionToSupabase(
        { habitId: String(operation.payload.habitId), emoji: String(operation.payload.emoji), date: String(operation.payload.date) },
        String(operation.payload.fromUser),
        String(operation.payload.toUser),
        String(operation.payload.pairId),
      );
    }
    if (synced) syncedIds.push(operation.id);
  }
  return syncedIds;
};
