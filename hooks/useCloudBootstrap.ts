import { useEffect } from 'react';

import { ensureSession } from '@/features/auth/auth';
import { getPairMembers, mapPairMembers, type PairMember } from '@/features/pairing/pairing';
import { addLocalDays } from '@/lib/date';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useLocalDate } from '@/hooks/useLocalDate';
import { useMomDailyStore, type Actor, type CompletionByDate, type DailyMessagesByDate, type Footprint, type Nudge, type QuickMessage, type Reaction } from '@/store/useMomDailyStore';

const buildCloudCompletions = (rows: Array<{ habit_id: string; user_id: string; date: string; completed_at: string }>, userIds: { me: string; mom: string }): CompletionByDate => {
  const completions: CompletionByDate = {};
  rows.forEach((row) => {
    const actor: Actor | null = row.user_id === userIds.me ? 'me' : row.user_id === userIds.mom ? 'mom' : null;
    if (!actor) return;
    const current = completions[row.date]?.[row.habit_id] ?? { me: false, mom: false };
    const timestampKey = actor === 'me' ? 'meCompletedAt' : 'momCompletedAt';
    completions[row.date] = { ...(completions[row.date] ?? {}), [row.habit_id]: { ...current, [actor]: true, [timestampKey]: row.completed_at } };
  });
  return completions;
};

const buildCloudDailyMessages = (
  rows: Array<{ user_id: string; date: string; content: string; updated_at: string }>,
  userIds: { me: string; mom: string },
): DailyMessagesByDate => {
  const messages: DailyMessagesByDate = {};
  rows.forEach((row) => {
    const actor: Actor | null = row.user_id === userIds.me ? 'me' : row.user_id === userIds.mom ? 'mom' : null;
    if (!actor) return;
    messages[row.date] = { ...(messages[row.date] ?? {}), [actor]: { content: row.content, updatedAt: row.updated_at } };
  });
  return messages;
};

const buildCloudNudges = (
  rows: Array<{ id: string; habit_id: string; from_user: string; to_user: string; date: string; created_at: string }>,
  userIds: { me: string; mom: string },
): Nudge[] => rows.flatMap((row) => {
  const from: Actor | null = row.from_user === userIds.me ? 'me' : row.from_user === userIds.mom ? 'mom' : null;
  const to: Actor | null = row.to_user === userIds.me ? 'me' : row.to_user === userIds.mom ? 'mom' : null;
  return from && to ? [{ id: row.id, habitId: row.habit_id, from, to, date: row.date, createdAt: row.created_at }] : [];
});

const buildCloudReactions = (
  rows: Array<{ id: string; habit_id: string; from_user: string; to_user: string; emoji: string; date: string; created_at: string }>,
  userIds: { me: string; mom: string },
): Reaction[] => rows.flatMap((row) => {
  const from: Actor | null = row.from_user === userIds.me ? 'me' : row.from_user === userIds.mom ? 'mom' : null;
  const to: Actor | null = row.to_user === userIds.me ? 'me' : row.to_user === userIds.mom ? 'mom' : null;
  return from && to ? [{ id: row.id, habitId: row.habit_id, from, to, emoji: row.emoji, date: row.date, createdAt: row.created_at }] : [];
});

const buildCloudFootprints = (
  rows: Array<{ id: string; pair_id: string; province_code: string; province_name: string; city_code: string; city_name: string; created_by: string; visited_at: string }>,
  userIds: { me: string; mom: string },
): Footprint[] => rows.flatMap((row) => {
  const createdBy: Actor | null = row.created_by === userIds.me ? 'me' : row.created_by === userIds.mom ? 'mom' : null;
  return createdBy ? [{
    id: row.id,
    pairId: row.pair_id,
    provinceCode: row.province_code,
    provinceName: row.province_name,
    cityCode: row.city_code,
    cityName: row.city_name,
    visitedAt: row.visited_at,
    createdBy,
  }] : [];
});

const buildCloudQuickMessages = (
  rows: Array<{ id: string; pair_id: string; from_user: string; to_user: string; content: string; date: string; created_at: string }>,
  userIds: { me: string; mom: string },
): QuickMessage[] => rows.flatMap((row) => {
  const from: Actor | null = row.from_user === userIds.me ? 'me' : row.from_user === userIds.mom ? 'mom' : null;
  const to: Actor | null = row.to_user === userIds.me ? 'me' : row.to_user === userIds.mom ? 'mom' : null;
  return from && to ? [{ id: row.id, pairId: row.pair_id, from, to, content: row.content, date: row.date, createdAt: row.created_at }] : [];
});

export const useCloudBootstrap = () => {
  const demoMode = useMomDailyStore((state) => state.demoMode);
  const activeActor = useMomDailyStore((state) => state.activeActor);
  const pairId = useMomDailyStore((state) => state.pairId);
  const setPairConnection = useMomDailyStore((state) => state.setPairConnection);
  const setCloudCompletions = useMomDailyStore((state) => state.setCloudCompletions);
  const setCloudDailyMessages = useMomDailyStore((state) => state.setCloudDailyMessages);
  const setCloudNudges = useMomDailyStore((state) => state.setCloudNudges);
  const setCloudReactions = useMomDailyStore((state) => state.setCloudReactions);
  const setCloudFootprints = useMomDailyStore((state) => state.setCloudFootprints);
  const setCloudQuickMessages = useMomDailyStore((state) => state.setCloudQuickMessages);
  const date = useLocalDate();

  useEffect(() => {
    const client = supabase;
    if (demoMode || !isSupabaseConfigured || !client) return undefined;
    let cancelled = false;
    let memberChannel: ReturnType<typeof client.channel> | null = null;

    const load = async () => {
      const sessionResult = await ensureSession();
      const currentUserId = sessionResult.data.session?.user.id;
      if (sessionResult.error || !currentUserId || cancelled) return;

      const profileResult = await client.from('profiles').select('id, display_name, avatar_url, pair_id, invite_code').eq('id', currentUserId).maybeSingle();
      const profile = profileResult.data as { display_name?: string; pair_id?: string; invite_code?: string } | null;
      const targetPairId = profile?.pair_id;
      if (profileResult.error || !targetPairId || cancelled) return;
      const resolvedActor: Actor = profile?.display_name === '妈妈' ? 'mom' : profile?.display_name === '我' ? 'me' : activeActor;

      const membersResult = await getPairMembers(targetPairId);
      if (membersResult.error || cancelled) return;
      const members = (membersResult.data ?? []) as PairMember[];
      const connection = mapPairMembers(members, currentUserId, resolvedActor);
      setPairConnection({
        pairId: targetPairId,
        inviteCode: profile.invite_code ?? '',
        memberCount: members.length,
        ...connection,
        activeActor: connection.activeActor,
      });

      if (!memberChannel) {
        memberChannel = client
          .channel('momdaily-pair-members-' + targetPairId)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'profiles',
              filter: 'pair_id=eq.' + targetPairId,
            },
            async () => {
              const latestMembersResult = await getPairMembers(targetPairId);
              const latestMembers = (latestMembersResult.data ?? []) as PairMember[];
              if (cancelled || latestMembersResult.error) return;
              setPairConnection({
                pairId: targetPairId,
                inviteCode: profile.invite_code ?? '',
                memberCount: latestMembers.length,
                ...mapPairMembers(latestMembers, currentUserId, resolvedActor),
              });
            },
          )
          .subscribe();
      }

      const startDate = addLocalDays(date, -730);
      const pageSize = 1000;
      const completionRows: Array<{ habit_id: string; user_id: string; date: string; completed_at: string }> = [];
      for (let page = 0; ; page += 1) {
        const completionsResult = await client
          .from('daily_completions')
          .select('habit_id, user_id, date, completed_at')
          .eq('pair_id', targetPairId)
          .gte('date', startDate)
          .lte('date', date)
          .order('date', { ascending: true })
          .range(page * pageSize, page * pageSize + pageSize - 1);
        if (cancelled || completionsResult.error) return;
        const rows = (completionsResult.data ?? []) as Array<{ habit_id: string; user_id: string; date: string; completed_at: string }>;
        completionRows.push(...rows);
        if (rows.length < pageSize) break;
      }
      if (cancelled) return;
      setCloudCompletions(buildCloudCompletions(completionRows, connection.userIds));

      const messageRows: Array<{ user_id: string; date: string; content: string; updated_at: string }> = [];
      for (let page = 0; ; page += 1) {
        const messagesResult = await client
          .from('daily_messages')
          .select('user_id, date, content, updated_at')
          .eq('pair_id', targetPairId)
          .gte('date', startDate)
          .lte('date', date)
          .order('date', { ascending: true })
          .range(page * pageSize, page * pageSize + pageSize - 1);
        if (cancelled || messagesResult.error) return;
        const rows = (messagesResult.data ?? []) as Array<{ user_id: string; date: string; content: string; updated_at: string }>;
        messageRows.push(...rows);
        if (rows.length < pageSize) break;
      }
      if (cancelled) return;
      setCloudDailyMessages(buildCloudDailyMessages(messageRows, connection.userIds));

      const [nudgesResult, reactionsResult] = await Promise.all([
        client
          .from('nudges')
          .select('id, habit_id, from_user, to_user, date, created_at')
          .eq('pair_id', targetPairId)
          .eq('date', date)
          .order('created_at', { ascending: true }),
        client
          .from('reactions')
          .select('id, habit_id, from_user, to_user, emoji, date, created_at')
          .eq('pair_id', targetPairId)
          .eq('date', date)
          .order('created_at', { ascending: true }),
      ]);
      if (cancelled || nudgesResult.error || reactionsResult.error) return;
      setCloudNudges(buildCloudNudges(
        (nudgesResult.data ?? []) as Array<{ id: string; habit_id: string; from_user: string; to_user: string; date: string; created_at: string }>,
        connection.userIds,
      ));
      setCloudReactions(buildCloudReactions(
        (reactionsResult.data ?? []) as Array<{ id: string; habit_id: string; from_user: string; to_user: string; emoji: string; date: string; created_at: string }>,
        connection.userIds,
      ));

      const quickMessagesResult = await client
        .from('quick_messages')
        .select('id, pair_id, from_user, to_user, content, date, created_at')
        .eq('pair_id', targetPairId)
        .eq('date', date)
        .order('created_at', { ascending: true });
      if (cancelled || quickMessagesResult.error) return;
      setCloudQuickMessages(buildCloudQuickMessages(
        (quickMessagesResult.data ?? []) as Array<{ id: string; pair_id: string; from_user: string; to_user: string; content: string; date: string; created_at: string }>,
        connection.userIds,
      ));

      const footprintsResult = await client
        .from('travel_footprints')
        .select('id, pair_id, province_code, province_name, city_code, city_name, created_by, visited_at')
        .eq('pair_id', targetPairId)
        .order('province_name', { ascending: true })
        .order('city_name', { ascending: true });
      if (cancelled || footprintsResult.error) return;
      setCloudFootprints(buildCloudFootprints(
        (footprintsResult.data ?? []) as Array<{ id: string; pair_id: string; province_code: string; province_name: string; city_code: string; city_name: string; created_by: string; visited_at: string }>,
        connection.userIds,
      ));
    };

    void load();
    const refreshOnReturn = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') void load();
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', refreshOnReturn);
    const refreshTimer = setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', refreshOnReturn);
      clearInterval(refreshTimer);
      if (memberChannel) void client.removeChannel(memberChannel);
    };
  }, [activeActor, date, demoMode, pairId, setCloudCompletions, setCloudDailyMessages, setCloudFootprints, setCloudNudges, setCloudQuickMessages, setCloudReactions, setPairConnection]);
};
