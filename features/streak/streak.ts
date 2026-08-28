import { defaultHabits } from '@/constants/habits';
import { addLocalDays, getLocalDate } from '@/lib/date';
import type { CompletionByDate, DailyCompletion } from '@/store/useMomDailyStore';

export const getDaySummary = (completions: CompletionByDate, date: string) => {
  const day = completions[date] ?? {};
  const meCount = defaultHabits.filter((habit) => Boolean(day[habit.id]?.me)).length;
  const momCount = defaultHabits.filter((habit) => Boolean(day[habit.id]?.mom)).length;
  const sharedCount = defaultHabits.filter((habit) => Boolean(day[habit.id]?.me && day[habit.id]?.mom)).length;
  return {
    meCount,
    momCount,
    sharedCount,
    isFullComplete: sharedCount === defaultHabits.length,
  };
};

export const isDayFull = (completions: CompletionByDate, date: string): boolean => {
  return getDaySummary(completions, date).isFullComplete;
};

export const getCurrentSharedStreak = (completions: CompletionByDate, today: string = getLocalDate()): number => {
  let cursor = today;
  if (!isDayFull(completions, cursor)) cursor = addLocalDays(cursor, -1);

  let count = 0;
  while (isDayFull(completions, cursor)) {
    count += 1;
    cursor = addLocalDays(cursor, -1);
  }
  return count;
};

export const getLongestSharedStreak = (completions: CompletionByDate): number => {
  const dates = Object.keys(completions).sort();
  let longest = 0;
  let running = 0;
  let previous: string | undefined;

  for (const date of dates) {
    if (!isDayFull(completions, date)) {
      running = 0;
      previous = date;
      continue;
    }

    if (previous && addLocalDays(previous, 1) === date) {
      running += 1;
    } else {
      running = 1;
    }
    longest = Math.max(longest, running);
    previous = date;
  }
  return longest;
};

export const getTotalSharedCompletions = (completions: CompletionByDate): number => {
  return Object.keys(completions).reduce((total, date) => total + getDaySummary(completions, date).sharedCount, 0);
};

export const getSharedDays = (completions: CompletionByDate): number => {
  return Object.keys(completions).filter((date) => getDaySummary(completions, date).sharedCount > 0).length;
};

export const getCompletionLevel = (completions: CompletionByDate, date: string): 0 | 1 | 2 => {
  const sharedCount = getDaySummary(completions, date).sharedCount;
  if (sharedCount === 0) return 0;
  if (sharedCount === defaultHabits.length) return 2;
  return 1;
};

export const getWeekSharedPercent = (completions: CompletionByDate, dates: string[]): number => {
  const completed = dates.reduce((total, date) => total + getDaySummary(completions, date).sharedCount, 0);
  return Math.round((completed / (dates.length * defaultHabits.length)) * 100);
};

export const getCompletion = (completions: CompletionByDate, date: string, habitId: string): DailyCompletion => {
  return completions[date]?.[habitId] ?? { me: false, mom: false };
};

