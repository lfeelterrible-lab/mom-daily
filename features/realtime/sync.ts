import type { Nudge, Reaction } from '@/store/useMomDailyStore';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type CompletionSyncPayload = {
  habitId: string;
  userId: string;
  pairId: string;
  date: string;
  completed: boolean;
};

export type DailyMessageSyncPayload = {
  userId: string;
  pairId: string;
  date: string;
  content: string;
};

export type FootprintSyncPayload = {
  pairId: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  userId: string;
  visitedAt: string;
};

export type QuickMessageSyncPayload = {
  pairId: string;
  userId: string;
  toUserId: string;
  date: string;
  content: string;
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

export const syncDailyMessageToSupabase = async (payload: DailyMessageSyncPayload) => {
  if (!supabase || !isSupabaseConfigured) return false;

  if (payload.content) {
    const { error } = await supabase.from('daily_messages').upsert(
      {
        pair_id: payload.pairId,
        user_id: payload.userId,
        date: payload.date,
        content: payload.content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'pair_id,user_id,date' },
    );
    if (error) console.warn('[MomDaily] daily message sync failed', error.message);
    return !error;
  }

  const { error } = await supabase
    .from('daily_messages')
    .delete()
    .eq('pair_id', payload.pairId)
    .eq('user_id', payload.userId)
    .eq('date', payload.date);
  if (error) console.warn('[MomDaily] daily message delete failed', error.message);
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

export const syncFootprintToSupabase = async (payload: FootprintSyncPayload) => {
  if (!supabase || !isSupabaseConfigured) return false;
  const { error } = await supabase.from('travel_footprints').upsert(
    {
      pair_id: payload.pairId,
      province_code: payload.provinceCode,
      province_name: payload.provinceName,
      city_code: payload.cityCode,
      city_name: payload.cityName,
      created_by: payload.userId,
      visited_at: payload.visitedAt,
    },
    { onConflict: 'pair_id,province_code,city_code' },
  );
  if (error) console.warn('[MomDaily] footprint sync failed', error.message);
  return !error;
};

export const removeFootprintFromSupabase = async (payload: Pick<FootprintSyncPayload, 'pairId' | 'provinceCode' | 'cityCode'>) => {
  if (!supabase || !isSupabaseConfigured) return false;
  const { error } = await supabase
    .from('travel_footprints')
    .delete()
    .eq('pair_id', payload.pairId)
    .eq('province_code', payload.provinceCode)
    .eq('city_code', payload.cityCode);
  if (error) console.warn('[MomDaily] footprint delete failed', error.message);
  return !error;
};

export const syncQuickMessageToSupabase = async (payload: QuickMessageSyncPayload) => {
  if (!supabase || !isSupabaseConfigured) return false;
  const { error } = await supabase.from('quick_messages').insert({
    pair_id: payload.pairId,
    from_user: payload.userId,
    to_user: payload.toUserId,
    date: payload.date,
    content: payload.content,
  });
  if (error) console.warn('[MomDaily] quick message sync failed', error.message);
  return !error;
};

export const flushPendingSync = async (
  operations: Array<{ id: string; type: 'completion' | 'nudge' | 'reaction' | 'message' | 'footprint-add' | 'footprint-remove' | 'quick-message'; payload: Record<string, string | boolean> }>,
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
    } else if (operation.type === 'reaction') {
      synced = await syncReactionToSupabase(
        { habitId: String(operation.payload.habitId), emoji: String(operation.payload.emoji), date: String(operation.payload.date) },
        String(operation.payload.fromUser),
        String(operation.payload.toUser),
        String(operation.payload.pairId),
      );
    } else if (operation.type === 'footprint-add') {
      synced = await syncFootprintToSupabase({
        pairId: String(operation.payload.pairId),
        provinceCode: String(operation.payload.provinceCode),
        provinceName: String(operation.payload.provinceName),
        cityCode: String(operation.payload.cityCode),
        cityName: String(operation.payload.cityName),
        userId: String(operation.payload.userId),
        visitedAt: String(operation.payload.visitedAt),
      });
    } else if (operation.type === 'footprint-remove') {
      synced = await removeFootprintFromSupabase({
        pairId: String(operation.payload.pairId),
        provinceCode: String(operation.payload.provinceCode),
        cityCode: String(operation.payload.cityCode),
      });
    } else if (operation.type === 'quick-message') {
      synced = await syncQuickMessageToSupabase({
        pairId: String(operation.payload.pairId),
        userId: String(operation.payload.userId),
        toUserId: String(operation.payload.toUserId),
        date: String(operation.payload.date),
        content: String(operation.payload.content),
      });
    } else {
      synced = await syncDailyMessageToSupabase({
        userId: String(operation.payload.userId),
        pairId: String(operation.payload.pairId),
        date: String(operation.payload.date),
        content: String(operation.payload.content),
      });
    }
    if (synced) syncedIds.push(operation.id);
  }
  return syncedIds;
};
