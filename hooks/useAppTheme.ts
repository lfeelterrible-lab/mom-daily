import { palette, type ThemeMode, type ThemePalette } from '@/constants/theme';
import { useMomDailyStore } from '@/store/useMomDailyStore';

export const useAppTheme = (): { colors: ThemePalette; isDark: boolean; mode: ThemeMode } => {
  const storedMode = useMomDailyStore((state) => state.themeMode);
  const isDark = storedMode === 'dark';
  return { colors: palette[isDark ? 'dark' : 'light'], isDark, mode: storedMode };
};
