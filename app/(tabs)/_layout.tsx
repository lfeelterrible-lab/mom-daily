import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';

import { FeedbackToast } from '@/components/FeedbackToast';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useCloudBootstrap } from '@/hooks/useCloudBootstrap';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePairPresence } from '@/hooks/usePairPresence';
import { useRealtimeCompletions } from '@/hooks/useRealtimeCompletions';
import { useRealtimeDailyMessages } from '@/hooks/useRealtimeDailyMessages';
import { useRealtimeFootprints } from '@/hooks/useRealtimeFootprints';
import { useRealtimeInteractions } from '@/hooks/useRealtimeInteractions';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { useMomDailyStore } from '@/store/useMomDailyStore';

export default function TabLayout() {
  const { colors } = useAppTheme();
  useRealtimeCompletions();
  useRealtimeDailyMessages();
  useRealtimeFootprints();
  useRealtimeInteractions();
  useCloudBootstrap();
  useNetworkStatus();
  usePairPresence();
  useSyncQueue();
  const isOnline = useMomDailyStore((state) => state.isOnline);
  const lastEvent = useMomDailyStore((state) => state.lastEvent);
  const clearEvent = useMomDailyStore((state) => state.clearEvent);

  useEffect(() => {
    if (!lastEvent) return;
    const timeout = setTimeout(clearEvent, 4200);
    return () => clearTimeout(timeout);
  }, [clearEvent, lastEvent]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: {
          height: 76,
          paddingTop: 9,
          paddingBottom: 10,
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}>
        <Tabs.Screen
        name="index"
        options={{
          title: '今天',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '日历',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '记录',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: '我们',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size ?? 22} />,
        }}
        />
      </Tabs>
      {lastEvent ? <FeedbackToast message={lastEvent.message} offline={!isOnline} /> : null}
    </View>
  );
}
