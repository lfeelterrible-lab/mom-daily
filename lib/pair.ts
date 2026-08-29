import type { Actor } from '@/store/useMomDailyStore';

export type PairUserIds = { me: string; mom: string };

export const actorForUserId = (userId: string, userIds: PairUserIds): Actor | null => {
  if (userId === userIds.me) return 'me';
  if (userId === userIds.mom) return 'mom';
  return null;
};

export const userIdForActor = (actor: Actor, userIds: PairUserIds): string => userIds[actor];
