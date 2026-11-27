'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LivingPaperBackground } from '@/components/reactbits/LivingPaperBackground';
import { LandingThemeSwitcher, type LandingTheme } from '@/components/LandingThemeSwitcher';
import { LANDING_COPY, formatLandingNum } from '@/lib/landing-copy';

const LANDING_THEME_STORAGE_KEY = 'milla_landing_theme';

function isLandingTheme(value: string | null): value is LandingTheme {
  return value === 'light' || value === 'dark';
}

interface LandingSubpageShellProps {
  children: React.ReactNode;
}

export function LandingSubpageShell({ children }: LandingSubpageShellProps) {
  const lang = 'ar' as const;
  const [theme, setTheme] = useState<LandingTheme>('light');
  const copy = LANDING_COPY[lang];

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(LANDING_THEME_STORAGE_KEY);
      if (isLandingTheme(savedTheme)) {
        setTheme(savedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next: LandingTheme = prev === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(LANDING_THEME_STORAGE_KEY, next);
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <LivingPaperBackground />

      <header className="sticky top-3 z-40 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-2xl border border-border/85 bg-card/85 px-4 py-2.5 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src={
                  theme === 'dark'
                    ? '/images/al-milla-logo-dark.jpg'
                    : '/images/al-milla-logo.png'
                }
                alt={copy.brand}
                className="h-9 w-9 rounded-xl border border-border/70 object-cover"
              />
              <span className="text-base font-bold tracking-tight text-foreground">
                {copy.brand}
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <LandingThemeSwitcher theme={theme} lang={lang} onToggle={handleToggleTheme} />
              <Link
                href="/"
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-border bg-background/80 px-3.5 text-xs font-bold text-foreground transition-colors hover:bg-secondary"
              >
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                <span>الرئيسية</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>

      <footer className="relative z-10 border-t border-border/70 bg-card/70 py-8 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>
            © {formatLandingNum(2026, lang)} {copy.brand} • {copy.footerPrivacyNote}
          </p>
          <div className="flex flex-wrap items-center gap-4 font-semibold">
            <Link href="/download" className="transition-colors hover:text-primary">
              تحميل للأندرويد
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-primary">
              سياسة الخصوصية
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              شروط الاستخدام
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
