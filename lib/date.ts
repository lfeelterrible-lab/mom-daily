import { addDays, format, getDay, startOfWeek } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const pad = (value: number) => String(value).padStart(2, '0');

export const getLocalDate = (value: Date = new Date()): string => {
  return value.getFullYear() + '-' + pad(value.getMonth() + 1) + '-' + pad(value.getDate());
};

export const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

export const addLocalDays = (value: string, amount: number): string => {
  return getLocalDate(addDays(parseLocalDate(value), amount));
};

export const formatChineseDate = (value: string): string => {
  return format(parseLocalDate(value), 'yyyy年M月d日', { locale: zhCN });
};

export const formatMonth = (value: string): string => {
  return format(parseLocalDate(value), 'yyyy年M月', { locale: zhCN });
};

export const weekdayShort = (value: string): string => {
  return format(parseLocalDate(value), 'EEE', { locale: zhCN }).replace('星期', '周');
};

export const weekdayLong = (value: string): string => {
  return format(parseLocalDate(value), 'EEEE', { locale: zhCN });
};

export const getGreeting = (value: Date = new Date()): string => {
  const hour = value.getHours();
  if (hour < 11) return '早上好';
  if (hour < 18) return '下午好';
  return '晚上好';
};

export const getWeekDates = (value: string): string[] => {
  const monday = startOfWeek(parseLocalDate(value), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => getLocalDate(addDays(monday, index)));
};

export const getDateRange = (endDate: string, count: number): string[] => {
  return Array.from({ length: count }, (_, index) => addLocalDays(endDate, index - count + 1));
};

export const isToday = (value: string): boolean => value === getLocalDate();

export const getDayIndex = (value: string): number => getDay(parseLocalDate(value));

