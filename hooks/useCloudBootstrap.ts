import { useEffect } from 'react';

import { ensureSession } from '@/features/auth/auth';
import { getPairMembers, mapPairMembers, type PairMember } from '@/features/pairing/pairing';
import { addLocalDays } from '@/lib/date';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useLocalDate } from '@/hooks/useLocalDate';
import { useMomDailyStore, type Actor, type CompletionByDate } from '@/store/useMomDailyStore';

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

export const useCloudBootstrap = () => {
  const demoMode = useMomDailyStore((state) => state.demoMode);
  const activeActor = useMomDailyStore((state) => state.activeActor);
  const pairId = useMomDailyStore((state) => state.pairId);
  const setPairConnection = useMomDailyStore((state) => state.setPairConnection);
  const setCloudCompletions = useMomDailyStore((state) => state.setCloudCompletions);
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
    };

    void load();
    const refreshTimer = setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(refreshTimer);
      if (memberChannel) void client.removeChannel(memberChannel);
    };
  }, [activeActor, date, demoMode, pairId, setCloudCompletions, setPairConnection]);
};
