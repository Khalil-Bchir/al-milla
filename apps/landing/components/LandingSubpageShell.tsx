'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ArrowRight, Menu, X } from 'lucide-react';
import { LivingPaperBackground } from '@/components/reactbits/LivingPaperBackground';
import { LandingThemeSwitcher, type LandingTheme } from '@/components/LandingThemeSwitcher';
import { LANDING_COPY, formatLandingNum } from '@/lib/landing-copy';

const LANDING_THEME_STORAGE_KEY = 'milla_landing_theme';

function isLandingTheme(value: string | null): value is LandingTheme {
  return value === 'light' || value === 'dark';
}

interface LandingSubpageShellProps {
  children: React.ReactNode;
  containerClassName?: string;
}

export function LandingSubpageShell({
  children,
  containerClassName = 'max-w-4xl',
}: LandingSubpageShellProps) {
  const lang = 'ar' as const;
  const pathname = usePathname();
  const [theme, setTheme] = useState<LandingTheme>('light');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
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

  useEffect(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  }, []);

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

  const isDownload = pathname === '/download';

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <LivingPaperBackground />

      {/* Floating Pill Navigation matching Landing Page */}
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
                className="h-9 w-9 rounded-xl border border-border/80 object-cover shadow-2xs"
              />
              <span className="text-lg font-bold tracking-tight text-primary">{copy.brand}</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              <Link
                href="/#method"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
              >
                {copy.navMethod}
              </Link>
              <Link
                href="/#features"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
              >
                {copy.navFeatures}
              </Link>
              <Link
                href="/#principles"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
              >
                {copy.navPrinciples}
              </Link>
              <Link
                href="/#faq"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
              >
                {copy.navFaq}
              </Link>
              <Link
                href="/download"
                className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isDownload
                    ? 'bg-secondary text-primary'
                    : 'text-primary hover:bg-secondary/70'
                }`}
              >
                تحميل للأندرويد
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <LandingThemeSwitcher theme={theme} lang={lang} onToggle={handleToggleTheme} />
              <Link
                href={isDownload ? '/' : '/download'}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-2xs transition-opacity hover:opacity-95"
              >
                {isDownload ? (
                  <>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>الرئيسية</span>
                  </>
                ) : (
                  <>
                    <span>{copy.navStart}</span>
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  </>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                aria-label="Menu"
                aria-expanded={mobileNavOpen}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background/80 text-foreground md:hidden"
              >
                {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mobileNavOpen && (
            <nav className="mt-2.5 flex flex-col gap-1 border-t border-border/70 pt-2.5 md:hidden">
              <Link
                href="/#method"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary/60"
              >
                {copy.navMethod}
              </Link>
              <Link
                href="/#features"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary/60"
              >
                {copy.navFeatures}
              </Link>
              <Link
                href="/#principles"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary/60"
              >
                {copy.navPrinciples}
              </Link>
              <Link
                href="/#faq"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary/60"
              >
                {copy.navFaq}
              </Link>
              <Link
                href="/download"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-secondary/60"
              >
                تحميل للأندرويد (APK)
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className={`relative z-10 mx-auto ${containerClassName} px-4 py-10 sm:px-6 sm:py-14`}>
        {children}
      </main>

      <footer className="relative z-10 border-t border-border/70 bg-card/70 py-8 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>
            © {formatLandingNum(2026, lang)} {copy.brand} • {copy.footerPrivacyNote}
          </p>
          <div className="flex flex-wrap items-center gap-4 font-semibold">
            <Link href="/" className="transition-colors hover:text-primary">
              الرئيسية
            </Link>
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
