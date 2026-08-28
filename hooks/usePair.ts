import { DEMO_PAIR_ID } from '@/lib/supabase';
import { useMomDailyStore } from '@/store/useMomDailyStore';

export const usePair = () => {
  const pairId = useMomDailyStore((state) => state.pairId);
  const inviteCode = useMomDailyStore((state) => state.inviteCode);
  const displayNames = useMomDailyStore((state) => state.displayNames);
  return {
    pairId: pairId || DEMO_PAIR_ID,
    inviteCode,
    displayNames,
    isPaired: Boolean(pairId),
  };
};

