'use client';

import { Moon, Sun } from 'lucide-react';
import type { LandingLang } from '@/lib/landing-copy';

export type LandingTheme = 'light' | 'dark';

interface LandingThemeSwitcherProps {
  theme: LandingTheme;
  lang: LandingLang;
  onToggle: () => void;
  variant?: 'icon' | 'pill';
}

export function LandingThemeSwitcher({
  theme,
  lang,
  onToggle,
  variant = 'icon',
}: LandingThemeSwitcherProps) {
  const isDark = theme === 'dark';
  const label = isDark
    ? lang === 'en'
      ? 'Light mode'
      : lang === 'fr'
        ? 'Mode clair'
        : 'الوضع النهاري'
    : lang === 'en'
      ? 'Dark mode'
      : lang === 'fr'
        ? 'Mode nuit'
        : 'الوضع الليلي';

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-pressed={isDark}
        className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-border bg-background/85 px-3.5 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-secondary"
      >
        {isDark ? (
          <Sun className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        ) : (
          <Moon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        )}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/85 text-foreground transition-colors hover:bg-secondary"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-accent" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4 text-primary" aria-hidden="true" />
      )}
    </button>
  );
}
