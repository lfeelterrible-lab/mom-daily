export const palette = {
  light: {
    background: '#F4F3EE',
    surface: '#FBFAF6',
    surfaceMuted: '#ECEEE7',
    surfaceGreen: '#E2EBDF',
    ink: '#193029',
    inkMuted: '#718078',
    inkSoft: '#9AA39C',
    line: '#DFE4DC',
    accent: '#DB6949',
    accentSoft: '#FBE8DF',
    success: '#6C9A78',
    successSoft: '#DDEBDD',
    sun: '#E4B84F',
    sunSoft: '#F7EBC5',
    lavender: '#877DA9',
    lavenderSoft: '#E9E5F2',
    white: '#FFFFFF',
    shadow: '#13271E',
  },
  dark: {
    background: '#101B16',
    surface: '#182820',
    surfaceMuted: '#21362B',
    surfaceGreen: '#243A2E',
    ink: '#F5F3EA',
    inkMuted: '#A9B6AC',
    inkSoft: '#718176',
    line: '#2C4436',
    accent: '#E57A57',
    accentSoft: '#4A2E27',
    success: '#85B58C',
    successSoft: '#2B4633',
    sun: '#E8C466',
    sunSoft: '#493E27',
    lavender: '#B1A6D5',
    lavenderSoft: '#373248',
    white: '#FFFFFF',
    shadow: '#050A07',
  },
} as const;

export type ThemeMode = 'light' | 'dark';
export type ThemePalette = (typeof palette)[ThemeMode];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  huge: 36,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  pill: 999,
} as const;

export const shadow = {
  shadowColor: palette.light.shadow,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.055,
  shadowRadius: 20,
  elevation: 2,
} as const;

