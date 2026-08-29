import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultHabits } from '@/constants/habits';
import { getLocalDate } from '@/lib/date';
import { DEMO_ME_ID, DEMO_MOM_ID, DEMO_PAIR_ID, isSupabaseConfigured } from '@/lib/supabase';
import { removeFootprintFromSupabase, syncCompletionToSupabase, syncDailyMessageToSupabase, syncFootprintToSupabase, syncNudgeToSupabase, syncReactionToSupabase } from '@/features/realtime/sync';
import type { ThemeMode } from '@/constants/theme';

export type Actor = 'me' | 'mom';

export type DailyCompletion = {
  me: boolean;
  mom: boolean;
  meCompletedAt?: string;
  momCompletedAt?: string;
};

export type CompletionByDate = Record<string, Record<string, DailyCompletion>>;

export type DailyMessage = {
  content: string;
  updatedAt: string;
};

export type DailyMessagesByDate = Record<string, Partial<Record<Actor, DailyMessage>>>;

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

export type Footprint = {
  id: string;
  pairId: string;
  provinceCode: string;
  provinceName: string;
  cityCode: string;
  cityName: string;
  visitedAt: string;
  createdBy: Actor;
};

export type PendingSync = {
  id: string;
  type: 'completion' | 'nudge' | 'reaction' | 'message' | 'footprint-add' | 'footprint-remove';
  payload: Record<string, string | boolean>;
};

export type ActivityEvent = {
  id: string;
  message: string;
  tone: 'success' | 'neutral';
};

export type PairPresence = {
  me: boolean;
  mom: boolean;
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
  pairPresence: PairPresence;
  completions: CompletionByDate;
  dailyMessages: DailyMessagesByDate;
  nudges: Nudge[];
  reactions: Reaction[];
  footprints: Footprint[];
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
  setPairPresence: (presence: PairPresence) => void;
  setCloudCompletions: (completions: CompletionByDate) => void;
  setCloudDailyMessages: (messages: DailyMessagesByDate) => void;
  setCloudNudges: (nudges: Nudge[]) => void;
  setCloudReactions: (reactions: Reaction[]) => void;
  setCloudFootprints: (footprints: Footprint[]) => void;
  setNotification: (key: 'enabled' | 'morningReminder' | 'eveningReminder', value: boolean) => void;
  toggleCompletion: (habitId: string, actor?: Actor) => void;
  applyRemoteCompletion: (habitId: string, actor: Actor, completed: boolean, date?: string) => void;
  saveDailyMessage: (content: string, actor?: Actor) => void;
  applyRemoteDailyMessage: (actor: Actor, content: string, date?: string, updatedAt?: string) => void;
  applyRemoteNudge: (nudge: Nudge) => void;
  applyRemoteReaction: (reaction: Reaction) => void;
  applyRemoteFootprint: (footprint: Footprint) => void;
  removeRemoteFootprint: (provinceCode: string, cityCode: string) => void;
  sendNudge: (habitId: string, actor?: Actor) => void;
  addReaction: (habitId: string, emoji: string, actor?: Actor) => void;
  toggleFootprint: (province: { code: string; name: string }, city: { code: string; name: string }) => void;
  clearEvent: () => void;
  addPendingSync: (operation: PendingSync) => void;
  removePendingSync: (id: string) => void;
  resetDemo: () => void;
};

const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) => prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
const footprintKey = (provinceCode: string, cityCode: string) => provinceCode + ':' + cityCode;

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
  pairPresence: demoModeEnabled ? { me: true, mom: true } : { me: false, mom: false },
  completions: demoModeEnabled ? makeInitialCompletions() : {},
  dailyMessages: demoModeEnabled
    ? {
        [getLocalDate()]: {
          me: { content: '今天也慢慢来，记得吃好每一顿饭。', updatedAt: nowIso() },
          mom: { content: '好呀，我们一起把今天过好。', updatedAt: nowIso() },
        },
      }
    : {},
  nudges: [] as Nudge[],
  reactions: [
    { id: 'reaction-seed', habitId: 'breakfast', from: 'mom', to: 'me', emoji: '❤️', date: getLocalDate(), createdAt: nowIso() },
  ] as Reaction[],
  footprints: [] as Footprint[],
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
        set((state) => ({ pairId, inviteCode, displayNames, userIds, ...(memberCount !== undefined ? { pairMemberCount: memberCount } : {}), ...(activeActor ? { activeActor } : {}), ...(state.pairId !== pairId ? { footprints: [] } : {}) })),
      setPairPresence: (pairPresence) => set({ pairPresence }),
      setCloudCompletions: (completions) => set({ completions }),
      setCloudDailyMessages: (dailyMessages) => set({ dailyMessages }),
      setCloudNudges: (nudges) => set({ nudges }),
      setCloudReactions: (reactions) => set({ reactions }),
      setCloudFootprints: (footprints) => set({ footprints }),
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
      saveDailyMessage: (rawContent, actor = get().activeActor) => {
        const date = getLocalDate();
        const content = rawContent.trim().slice(0, 80);
        const updatedAt = nowIso();

        set((state) => {
          const messagesForDate = { ...(state.dailyMessages[date] ?? {}) };
          if (content) {
            messagesForDate[actor] = { content, updatedAt };
          } else {
            delete messagesForDate[actor];
          }

          return {
            dailyMessages: { ...state.dailyMessages, [date]: messagesForDate },
            lastEvent: {
              id: makeId('message'),
              tone: 'success',
              message: content ? '今日寄语已留下，对方会立刻看到' : '今天的寄语已清空',
            },
          };
        });

        const userId = actor === 'me' ? get().userIds.me : get().userIds.mom;
        const pairId = get().pairId;
        const cloudReady = !get().demoMode && isSupabaseConfigured && Boolean(userId) && Boolean(pairId);
        const payload = { userId, pairId, date, content };

        if (get().isOnline && cloudReady) {
          void syncDailyMessageToSupabase(payload);
        } else if (!get().isOnline && cloudReady) {
          get().addPendingSync({
            id: makeId('queue'),
            type: 'message',
            payload,
          });
        }
      },
      applyRemoteDailyMessage: (actor, content, date = getLocalDate(), updatedAt = nowIso()) => {
        set((state) => {
          const messagesForDate = { ...(state.dailyMessages[date] ?? {}) };
          if (content) {
            messagesForDate[actor] = { content, updatedAt };
          } else {
            delete messagesForDate[actor];
          }

          const isOtherPerson = actor !== state.activeActor;
          return {
            dailyMessages: { ...state.dailyMessages, [date]: messagesForDate },
            lastEvent:
              content && isOtherPerson
                ? { id: makeId('remote-message'), tone: 'success', message: (actor === 'mom' ? '妈妈' : '我') + '留下了今日寄语' }
                : state.lastEvent,
          };
        });
      },
      applyRemoteNudge: (nudge) => {
        set((state) => {
          if (state.nudges.some((item) => item.id === nudge.id)) return state;
          const habitName = defaultHabits.find((habit) => habit.id === nudge.habitId)?.name ?? '这件小事';
          return {
            nudges: [...state.nudges, nudge],
            lastEvent: {
              id: makeId('remote-nudge'),
              tone: 'neutral',
              message: (nudge.from === 'mom' ? '妈妈' : '我') + '提醒你完成「' + habitName + '」',
            },
          };
        });
      },
      applyRemoteReaction: (reaction) => {
        set((state) => {
          if (state.reactions.some((item) => item.id === reaction.id)) return state;
          return {
            reactions: [...state.reactions, reaction],
            lastEvent: {
              id: makeId('remote-reaction'),
              tone: 'success',
              message: (reaction.from === 'mom' ? '妈妈' : '我') + '给你发送了 ' + reaction.emoji,
            },
          };
        });
      },
      applyRemoteFootprint: (footprint) => {
        set((state) => {
          if (state.footprints.some((item) => footprintKey(item.provinceCode, item.cityCode) === footprintKey(footprint.provinceCode, footprint.cityCode))) return state;
          return {
            footprints: [...state.footprints, footprint],
            lastEvent: {
              id: makeId('remote-footprint'),
              tone: 'success',
              message: (footprint.createdBy === 'mom' ? '妈妈' : '我') + '记下了“' + footprint.provinceName + '·' + footprint.cityName + '”',
            },
          };
        });
      },
      removeRemoteFootprint: (provinceCode, cityCode) => {
        set((state) => ({ footprints: state.footprints.filter((item) => footprintKey(item.provinceCode, item.cityCode) !== footprintKey(provinceCode, cityCode)) }));
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
      toggleFootprint: (province, city) => {
        const state = get();
        const pairId = state.pairId;
        const actor = state.activeActor;
        const userId = state.userIds[actor];
        const existing = state.footprints.find((item) => footprintKey(item.provinceCode, item.cityCode) === footprintKey(province.code, city.code));
        const cloudReady = !state.demoMode && isSupabaseConfigured && Boolean(pairId) && Boolean(userId);

        if (!pairId && !state.demoMode) {
          set({ lastEvent: { id: makeId('footprint-pair'), tone: 'neutral', message: '先完成双人绑定，再记录我们的足迹' } });
          return;
        }

        if (existing) {
          set((current) => ({
            footprints: current.footprints.filter((item) => footprintKey(item.provinceCode, item.cityCode) !== footprintKey(province.code, city.code)),
            lastEvent: { id: makeId('footprint-remove'), tone: 'neutral', message: '已移除“' + province.name + '·' + city.name + '”' },
          }));
          const removePayload = { pairId, provinceCode: province.code, cityCode: city.code };
          if (state.isOnline && cloudReady) {
            void removeFootprintFromSupabase(removePayload);
          } else if (!state.isOnline && cloudReady) {
            get().addPendingSync({ id: makeId('queue'), type: 'footprint-remove', payload: removePayload });
          }
          return;
        }

        const footprint: Footprint = {
          id: makeId('footprint'),
          pairId,
          provinceCode: province.code,
          provinceName: province.name,
          cityCode: city.code,
          cityName: city.name,
          visitedAt: nowIso(),
          createdBy: actor,
        };
        set((current) => ({
          footprints: [...current.footprints, footprint],
          lastEvent: { id: footprint.id, tone: 'success', message: '已记下“' + province.name + '·' + city.name + '”' },
        }));
        const addPayload = { pairId, provinceCode: province.code, provinceName: province.name, cityCode: city.code, cityName: city.name, userId, visitedAt: footprint.visitedAt };
        if (state.isOnline && cloudReady) {
          void syncFootprintToSupabase(addPayload);
        } else if (!state.isOnline && cloudReady) {
          get().addPendingSync({ id: makeId('queue'), type: 'footprint-add', payload: addPayload });
        }
      },
      clearEvent: () => set({ lastEvent: null }),
      addPendingSync: (operation) => set((state) => ({ pendingSync: [...state.pendingSync, operation] })),
      removePendingSync: (id) => set((state) => ({ pendingSync: state.pendingSync.filter((item) => item.id !== id) })),
      resetDemo: () =>
        set({
          completions: makeInitialCompletions(),
          dailyMessages: {
            [getLocalDate()]: {
              me: { content: '今天也慢慢来，记得吃好每一顿饭。', updatedAt: nowIso() },
              mom: { content: '好呀，我们一起把今天过好。', updatedAt: nowIso() },
            },
          },
          nudges: [],
          reactions: [],
          footprints: [],
          pendingSync: [],
          lastEvent: { id: makeId('reset'), tone: 'neutral', message: 'Demo 已恢复到今天的示例状态' },
        }),
    }),
    {
      name: 'momdaily-local-state',
      storage: createJSONStorage(() => localStorage),
       version: 5,
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
