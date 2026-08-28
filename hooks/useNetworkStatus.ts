import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { useEffect } from 'react';

import { useMomDailyStore } from '@/store/useMomDailyStore';

const onlineFromState = (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => {
  return Boolean(state.isConnected && state.isInternetReachable !== false);
};

export const useNetworkStatus = () => {
  const setDetectedOnline = useMomDailyStore((state) => state.setDetectedOnline);

  useEffect(() => {
    let mounted = true;

    if (Platform.OS === 'web') {
      const updateBrowserStatus = () => {
        if (mounted) setDetectedOnline(typeof navigator === 'undefined' || navigator.onLine !== false);
      };

      updateBrowserStatus();
      window.addEventListener('online', updateBrowserStatus);
      window.addEventListener('offline', updateBrowserStatus);
      return () => {
        mounted = false;
        window.removeEventListener('online', updateBrowserStatus);
        window.removeEventListener('offline', updateBrowserStatus);
      };
    }

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
