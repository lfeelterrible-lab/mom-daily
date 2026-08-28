import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';

import { useMomDailyStore } from '@/store/useMomDailyStore';

const onlineFromState = (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
  return Boolean(state.isConnected && state.isInternetReachable !== false);
};

export const useNetworkStatus = () => {
  const setDetectedOnline = useMomDailyStore((state) => state.setDetectedOnline);

  useEffect(() => {
    let mounted = true;
    void NetInfo.fetch().then((state) => {
      if (mounted) setDetectedOnline(onlineFromState(state));
    });
    const unsubscribe = NetInfo.addEventListener((state) => setDetectedOnline(onlineFromState(state)));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [setDetectedOnline]);
};
