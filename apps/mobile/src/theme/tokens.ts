export const QURAN_FONT_FAMILY = 'AmiriQuran';

export interface MillaTheme {
  isDark: boolean;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  heroBg: string;
}

export const LIGHT_THEME: MillaTheme = {
  isDark: false,
  background: '#f7f5ed',
  foreground: '#242a25',
  card: '#ffffff',
  cardForeground: '#242a25',
  primary: '#073d35',
  primaryForeground: '#ffffff',
  secondary: '#e7ede5',
  secondaryForeground: '#073d35',
  muted: '#eaf0e8',
  mutedForeground: '#5B6059',
  accent: '#ff8e79',
  accentForeground: '#242a25',
  destructive: '#ba1a1a',
  destructiveForeground: '#ffffff',
  border: '#e8e7df',
  heroBg: '#073d35',
};

export const DARK_THEME: MillaTheme = {
  isDark: true,
  background: '#0B0B0A',
  foreground: '#F2EFE6',
  card: '#141413',
  cardForeground: '#F2EFE6',
  primary: '#F2EFE6',
  primaryForeground: '#0B0B0A',
  secondary: '#1B1D1B',
  secondaryForeground: '#F2EFE6',
  muted: '#1B1D1B',
  mutedForeground: '#9E9D96',
  accent: '#ff8e79',
  accentForeground: '#1A100E',
  destructive: '#cf6679',
  destructiveForeground: '#14080a',
  border: '#2A2B28',
  heroBg: '#1B1D1B',
};

export function getTheme(nightMode: boolean): MillaTheme {
  return nightMode ? DARK_THEME : LIGHT_THEME;
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const RADII = {
  control: 12,
  card: 16,
  hero: 24,
  pill: 999,
} as const;

export const MIN_TOUCH_TARGET = 48;
