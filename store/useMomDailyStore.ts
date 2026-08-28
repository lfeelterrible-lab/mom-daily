import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultHabits } from '@/constants/habits';
import { getLocalDate } from '@/lib/date';
import { DEMO_ME_ID, DEMO_MOM_ID, DEMO_PAIR_ID, isSupabaseConfigured } from '@/lib/supabase';
import { syncCompletionToSupabase, syncNudgeToSupabase, syncReactionToSupabase } from '@/features/realtime/sync';
import type { ThemeMode } from '@/constants/theme';

export type Actor = 'me' | 'mom';

export type DailyCompletion = {
  me: boolean;
  mom: boolean;
  meCompletedAt?: string;
  momCompletedAt?: string;
};

export type CompletionByDate = Record<string, Record<string, DailyCompletion>>;

export type Nudge = {
  id: string;
  habitId: string;
  from: Actor;
  to: Actor;
  date: string;
  createdAt: string;
};

export type Reaction = {
  id: string;
  habitId: string;
  from: Actor;
  to: Actor;
  emoji: string;
  date: string;
  createdAt: string;
};

export type PendingSync = {
  id: string;
  type: 'completion' | 'nudge' | 'reaction';
  payload: Record<string, string | boolean>;
};

export type ActivityEvent = {
  id: string;
  message: string;
  tone: 'success' | 'neutral';
};

type Store = {
  hydrated: boolean;
  demoMode: boolean;
  activeActor: Actor;
  themeMode: ThemeMode;
  hasSeenOnboarding: boolean;
  isOnline: boolean;
  offlineOverride: boolean;
  pairId: string;
  inviteCode: string;
  pairMemberCount: number;
  displayNames: { me: string; mom: string };
  userIds: { me: string; mom: string };
  completions: CompletionByDate;
  nudges: Nudge[];
  reactions: Reaction[];
  pendingSync: PendingSync[];
  notificationSettings: {
    enabled: boolean;
    morningReminder: boolean;
    eveningReminder: boolean;
  };
  lastEvent: ActivityEvent | null;
  setHydrated: (hydrated: boolean) => void;
  setActiveActor: (actor: Actor) => void;
  setDemoMode: (enabled: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setOnline: (online: boolean) => void;
  setDetectedOnline: (online: boolean) => void;
  setPairConnection: (connection: { pairId: string; inviteCode: string; displayNames: { me: string; mom: string }; userIds: { me: string; mom: string }; memberCount?: number; activeActor?: Actor }) => void;
  setCloudCompletions: (completions: CompletionByDate) => void;
  setNotification: (key: 'enabled' | 'morningReminder' | 'eveningReminder', value: boolean) => void;
  toggleCompletion: (habitId: string, actor?: Actor) => void;
  applyRemoteCompletion: (habitId: string, actor: Actor, completed: boolean, date?: string) => void;
  sendNudge: (habitId: string, actor?: Actor) => void;
  addReaction: (habitId: string, emoji: string, actor?: Actor) => void;
  clearEvent: () => void;
  addPendingSync: (operation: PendingSync) => void;
  removePendingSync: (id: string) => void;
  resetDemo: () => void;
};

const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) => prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);

const blankDay = (): Record<string, DailyCompletion> =>
  Object.fromEntries(defaultHabits.map((habit) => [habit.id, { me: false, mom: false }]));

const fullDay = (): Record<string, DailyCompletion> =>
  Object.fromEntries(
    defaultHabits.map((habit) => [
      habit.id,
      { me: true, mom: true, meCompletedAt: nowIso(), momCompletedAt: nowIso() },
    ]),
  );

const makeInitialCompletions = (): CompletionByDate => {
  const today = getLocalDate();
  const result: CompletionByDate = {};

  for (let offset = 1; offset <= 26; offset += 1) {
    result[shiftDate(today, -offset)] = fullDay();
  }

  for (let offset = 28; offset <= 68; offset += 1) {
    result[shiftDate(today, -offset)] = fullDay();
  }

  for (let offset = 69; offset <= 140; offset += 1) {
    const day = blankDay();
    const sharedCount = offset % 9 === 0 ? 0 : Math.max(1, 11 - (offset % 7));
    defaultHabits.slice(0, sharedCount).forEach((habit) => {
      day[habit.id] = { me: true, mom: true, meCompletedAt: nowIso(), momCompletedAt: nowIso() };
    });
    if (offset % 5 === 0) {
      day.vocabulary = { me: true, mom: false, meCompletedAt: nowIso() };
    }
    result[shiftDate(today, -offset)] = day;
  }

  const todayDay = blankDay();
  defaultHabits.slice(0, 6).forEach((habit) => {
    todayDay[habit.id] = { me: true, mom: true, meCompletedAt: nowIso(), momCompletedAt: nowIso() };
  });
  todayDay.dinner = { me: true, mom: false, meCompletedAt: nowIso() };
  result[today] = todayDay;
  return result;
};

const shiftDate = (date: string, amount: number): string => {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(year, month - 1, day, 12, 0, 0, 0);
  next.setDate(next.getDate() + amount);
  return next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2, '0') + '-' + String(next.getDate()).padStart(2, '0');
};

const demoModeEnabled = process.env.EXPO_PUBLIC_DEV_DEMO_MODE === 'true';

const ssrSafeStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => undefined,
  removeItem: async (_key: string) => undefined,
};

const localStorage = typeof window === 'undefined' ? ssrSafeStorage : AsyncStorage;

const initialState = {
  hydrated: false,
  demoMode: demoModeEnabled,
  activeActor: 'me' as Actor,
  themeMode: 'light' as ThemeMode,
  hasSeenOnboarding: false,
  isOnline: true,
  offlineOverride: false,
  pairId: demoModeEnabled ? 'demo-pair-momdaily' : '',
  inviteCode: demoModeEnabled ? 'MOM826' : '',
  pairMemberCount: demoModeEnabled ? 2 : 0,
  displayNames: { me: '我', mom: '妈妈' },
  userIds: demoModeEnabled ? { me: DEMO_ME_ID, mom: DEMO_MOM_ID } : { me: '', mom: '' },
  completions: demoModeEnabled ? makeInitialCompletions() : {},
  nudges: [] as Nudge[],
  reactions: [
    { id: 'reaction-seed', habitId: 'breakfast', from: 'mom', to: 'me', emoji: '❤️', date: getLocalDate(), createdAt: nowIso() },
  ] as Reaction[],
  pendingSync: [] as PendingSync[],
  notificationSettings: {
    enabled: true,
    morningReminder: true,
    eveningReminder: true,
  },
  lastEvent: null as ActivityEvent | null,
};

export const useMomDailyStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,
      setHydrated: (hydrated) => set({ hydrated }),
      setActiveActor: (activeActor) => set({ activeActor }),
      setDemoMode: (demoMode) => set({ demoMode }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
      setOnline: (isOnline) => set({ isOnline, offlineOverride: !isOnline }),
      setDetectedOnline: (isOnline) => set((state) => (state.offlineOverride ? state : { isOnline })),
      setPairConnection: ({ pairId, inviteCode, displayNames, userIds, memberCount, activeActor }) =>
        set({ pairId, inviteCode, displayNames, userIds, ...(memberCount !== undefined ? { pairMemberCount: memberCount } : {}), ...(activeActor ? { activeActor } : {}) }),
      setCloudCompletions: (completions) => set({ completions }),
      setNotification: (key, value) =>
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, [key]: value },
        })),
      toggleCompletion: (habitId, actor = get().activeActor) => {
        const date = getLocalDate();
        const current = get().completions[date]?.[habitId] ?? { me: false, mom: false };
        const nextValue = !current[actor];
        const timestampKey = actor === 'me' ? 'meCompletedAt' : 'momCompletedAt';
        const nextCompletion = {
          ...current,
          [actor]: nextValue,
          [timestampKey]: nextValue ? nowIso() : undefined,
        };

        set((state) => {
          const today = { ...(state.completions[date] ?? {}) };
          today[habitId] = nextCompletion;
          const sharedNow = nextCompletion.me && nextCompletion.mom;
          const actorLabel = actor === 'me' ? '我' : '妈妈';
          return {
            completions: { ...state.completions, [date]: today },
            lastEvent: nextValue
              ? {
                  id: makeId('completion'),
                  tone: sharedNow ? 'success' : 'neutral',
                  message: sharedNow ? '今天又一起完成了一件小事 ✨' : actorLabel + '完成了这件事',
                }
              : null,
          };
        });

        const userId = actor === 'me' ? get().userIds.me : get().userIds.mom;
        const cloudReady = !get().demoMode && isSupabaseConfigured;
        const payload = { habitId, userId, pairId: get().pairId, date, completed: nextValue };
        if (get().isOnline && cloudReady) {
          void syncCompletionToSupabase(payload);
        } else {
          if (!get().isOnline) {
            get().addPendingSync({
              id: makeId('queue'),
              type: 'completion',
              payload: { habitId, userId, pairId: get().pairId, date, completed: nextValue },
            });
          }
        }
      },
      applyRemoteCompletion: (habitId, actor, completed, date = getLocalDate()) => {
        set((state) => {
          const current = state.completions[date]?.[habitId] ?? { me: false, mom: false };
          const timestampKey = actor === 'me' ? 'meCompletedAt' : 'momCompletedAt';
          const nextCompletion = {
            ...current,
            [actor]: completed,
            [timestampKey]: completed ? nowIso() : undefined,
          };
          return {
            completions: {
              ...state.completions,
              [date]: { ...(state.completions[date] ?? {}), [habitId]: nextCompletion },
            },
            lastEvent: completed
              ? { id: makeId('remote'), tone: 'success', message: (actor === 'mom' ? '妈妈' : '我') + '刚刚完成了这件事' }
              : state.lastEvent,
          };
        });
      },
      sendNudge: (habitId, actor = get().activeActor) => {
        const date = getLocalDate();
        const to: Actor = actor === 'me' ? 'mom' : 'me';
        const count = get().nudges.filter((item) => item.habitId === habitId && item.date === date && item.from === actor).length;
        if (count >= 2) {
          set({ lastEvent: { id: makeId('nudge-limit'), tone: 'neutral', message: '今天已经提醒过两次啦，给对方一点时间 ❤️' } });
          return;
        }
        const nudge = { id: makeId('nudge'), habitId, from: actor, to, date, createdAt: nowIso() };
        set((state) => ({
          nudges: [...state.nudges, nudge],
          lastEvent: { id: nudge.id, tone: 'success', message: '提醒已送达，轻轻等一下就好' },
        }));
        if (get().isOnline && !get().demoMode && isSupabaseConfigured) {
          void syncNudgeToSupabase(nudge, actor === 'me' ? get().userIds.me : get().userIds.mom, to === 'me' ? get().userIds.me : get().userIds.mom, get().pairId);
        } else if (!get().isOnline) {
          get().addPendingSync({
            id: makeId('queue'),
            type: 'nudge',
            payload: { habitId, fromUser: actor === 'me' ? get().userIds.me : get().userIds.mom, toUser: to === 'me' ? get().userIds.me : get().userIds.mom, pairId: get().pairId, date },
          });
        }
      },
      addReaction: (habitId, emoji, actor = get().activeActor) => {
        const to: Actor = actor === 'me' ? 'mom' : 'me';
        const reaction = { id: makeId('reaction'), habitId, from: actor, to, emoji, date: getLocalDate(), createdAt: nowIso() };
        set((state) => ({
          reactions: [...state.reactions, reaction],
          lastEvent: { id: reaction.id, tone: 'success', message: '回应已送达 ' + emoji },
        }));
        if (get().isOnline && !get().demoMode && isSupabaseConfigured) {
          void syncReactionToSupabase(reaction, actor === 'me' ? get().userIds.me : get().userIds.mom, to === 'me' ? get().userIds.me : get().userIds.mom, get().pairId);
        } else if (!get().isOnline) {
          get().addPendingSync({
            id: makeId('queue'),
            type: 'reaction',
            payload: { habitId, fromUser: actor === 'me' ? get().userIds.me : get().userIds.mom, toUser: to === 'me' ? get().userIds.me : get().userIds.mom, pairId: get().pairId, emoji, date: reaction.date },
          });
        }
      },
      clearEvent: () => set({ lastEvent: null }),
      addPendingSync: (operation) => set((state) => ({ pendingSync: [...state.pendingSync, operation] })),
      removePendingSync: (id) => set((state) => ({ pendingSync: state.pendingSync.filter((item) => item.id !== id) })),
      resetDemo: () =>
        set({
          completions: makeInitialCompletions(),
          nudges: [],
          reactions: [],
          pendingSync: [],
          lastEvent: { id: makeId('reset'), tone: 'neutral', message: 'Demo 已恢复到今天的示例状态' },
        }),
    }),
    {
      name: 'momdaily-local-state',
      storage: createJSONStorage(() => localStorage),
      version: 4,
      migrate: (persisted) => {
        const persistedState = persisted as Partial<Store> | undefined;
        const hasLegacyDemoData = persistedState?.demoMode === true || persistedState?.pairId === DEMO_PAIR_ID;

        if (!demoModeEnabled && hasLegacyDemoData) {
          return initialState;
        }

        return {
          ...initialState,
          ...persistedState,
          demoMode: demoModeEnabled ? Boolean(persistedState?.demoMode ?? true) : false,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
