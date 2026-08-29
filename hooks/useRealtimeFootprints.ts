import { useEffect } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useMomDailyStore, type Actor, type Footprint } from '@/store/useMomDailyStore';

const actorForUserId = (userId: string, userIds: { me: string; mom: string }): Actor => userId === userIds.mom ? 'mom' : 'me';

export const useRealtimeFootprints = () => {
  const applyRemoteFootprint = useMomDailyStore((state) => state.applyRemoteFootprint);
  const removeRemoteFootprint = useMomDailyStore((state) => state.removeRemoteFootprint);
  const pairId = useMomDailyStore((state) => state.pairId);
  const userIds = useMomDailyStore((state) => state.userIds);
  const demoMode = useMomDailyStore((state) => state.demoMode);

  useEffect(() => {
    const client = supabase;
    if (!client || !isSupabaseConfigured || demoMode || !pairId) return undefined;

    const channel = client
      .channel('momdaily-footprints-' + pairId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'travel_footprints',
          filter: 'pair_id=eq.' + pairId,
        },
        (payload) => {
          const record = (payload.eventType === 'DELETE' ? payload.old : payload.new) as {
            id?: string;
            pair_id?: string;
            province_code?: string;
            province_name?: string;
            city_code?: string;
            city_name?: string;
            created_by?: string;
            visited_at?: string;
          };
          if (!record.province_code || !record.city_code) return;
          if (payload.eventType === 'DELETE') {
            removeRemoteFootprint(record.province_code, record.city_code);
            return;
          }
          if (!record.id || !record.province_name || !record.city_name || !record.created_by) return;
          const footprint: Footprint = {
            id: record.id,
            pairId,
            provinceCode: record.province_code,
            provinceName: record.province_name,
            cityCode: record.city_code,
            cityName: record.city_name,
            visitedAt: record.visited_at ?? new Date().toISOString(),
            createdBy: actorForUserId(record.created_by, userIds),
          };
          applyRemoteFootprint(footprint);
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [applyRemoteFootprint, demoMode, pairId, removeRemoteFootprint, userIds]);
};
