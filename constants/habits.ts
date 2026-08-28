export type HabitCategory = '晨间' | '上午 / 中午' | '下午' | '晚上' | '睡前';

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  sortOrder: number;
  category: HabitCategory;
  defaultTime: string;
};

export const defaultHabits: Habit[] = [
  { id: 'breakfast', name: '早饭', emoji: '🍳', sortOrder: 1, category: '晨间', defaultTime: '07:00–09:00' },
  { id: 'streak', name: '续火花', emoji: '🔥', sortOrder: 2, category: '晨间', defaultTime: '09:00–10:30' },
  { id: 'voice_call', name: '语音通话', emoji: '📞', sortOrder: 3, category: '上午 / 中午', defaultTime: '10:30–12:00' },
  { id: 'lunch', name: '午饭', emoji: '🍚', sortOrder: 4, category: '上午 / 中午', defaultTime: '11:30–13:30' },
  { id: 'watch_together', name: '一起看', emoji: '📺', sortOrder: 5, category: '上午 / 中午', defaultTime: '12:30–14:00' },
  { id: 'nap', name: '午休', emoji: '😴', sortOrder: 6, category: '下午', defaultTime: '13:00–14:30' },
  { id: 'dinner', name: '晚饭', emoji: '🍲', sortOrder: 7, category: '晚上', defaultTime: '17:30–20:00' },
  { id: 'duolingo', name: '多邻国', emoji: '🦉', sortOrder: 8, category: '晚上', defaultTime: '19:00–21:00' },
  { id: 'vocabulary', name: '背单词', emoji: '📚', sortOrder: 9, category: '晚上', defaultTime: '19:30–21:30' },
  { id: 'douyin_heart', name: '抖音比心', emoji: '❤️', sortOrder: 10, category: '晚上', defaultTime: '20:00–22:00' },
  { id: 'sleep', name: '睡觉', emoji: '🌙', sortOrder: 11, category: '睡前', defaultTime: '22:00–00:30' },
];

export const habitById = Object.fromEntries(defaultHabits.map((habit) => [habit.id, habit])) as Record<string, Habit>;

