import { DEMO_PAIR_ID } from '@/lib/supabase';
import { useMomDailyStore } from '@/store/useMomDailyStore';

export const usePair = () => {
  const pairId = useMomDailyStore((state) => state.pairId);
  const inviteCode = useMomDailyStore((state) => state.inviteCode);
  const displayNames = useMomDailyStore((state) => state.displayNames);
  const demoMode = useMomDailyStore((state) => state.demoMode);
  return {
    pairId: pairId || (demoMode ? DEMO_PAIR_ID : ''),
    inviteCode: inviteCode || (demoMode ? 'MOM826' : ''),
    displayNames,
    isPaired: Boolean(pairId),
  };
};
