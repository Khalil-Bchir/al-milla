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
  mutedForeground: '#777b74',
  accent: '#ff8e79',
  accentForeground: '#242a25',
  destructive: '#ba1a1a',
  destructiveForeground: '#ffffff',
  border: '#e8e7df',
  heroBg: '#073d35',
};

export const DARK_THEME: MillaTheme = {
  isDark: true,
  background: '#0d1613',
  foreground: '#f2f1e8',
  card: '#13201c',
  cardForeground: '#f2f1e8',
  primary: '#9fd0c5',
  primaryForeground: '#06221d',
  secondary: '#1b2c26',
  secondaryForeground: '#dce8e2',
  muted: '#182722',
  mutedForeground: '#9ca8a1',
  accent: '#ff8e79',
  accentForeground: '#1a100e',
  destructive: '#cf6679',
  destructiveForeground: '#14080a',
  border: '#22362f',
  heroBg: '#073d35',
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

export const MIN_TOUCH_TARGET = 44;
