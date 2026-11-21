'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Home, RotateCcw, Settings, User, WifiOff } from 'lucide-react';
import { MushafIcon } from '@/components/milla/MushafIcon';
import { cn } from '@/lib/utils';
import { MILLA_COPY } from '@/lib/milla-i18n';
import { useMillaStore } from '@/store/milla-store';

interface AppShellProps {
  title: string;
  subtitle?: string;
  hideBottomNav?: boolean;
  hideTopActions?: boolean;
  children: React.ReactNode;
}

export function AppShell({
  title,
  subtitle,
  hideBottomNav = false,
  hideTopActions = false,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const language = useMillaStore((s) => s.language);
  const [isOffline, setIsOffline] = useState(false);

  const copy = MILLA_COPY[language];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncOnline = () => setIsOffline(!window.navigator.onLine);
    syncOnline();
    window.addEventListener('online', syncOnline);
    window.addEventListener('offline', syncOnline);
    return () => {
      window.removeEventListener('online', syncOnline);
      window.removeEventListener('offline', syncOnline);
    };
  }, []);

  const navItems = [
    { href: '/', label: copy.navHome, icon: Home, active: pathname === '/' },
    {
      href: '/memorize',
      label: copy.navMemorize,
      icon: BookOpen,
      active: pathname.startsWith('/memorize'),
    },
    {
      href: '/revision',
      label: copy.navRevision,
      icon: RotateCcw,
      active:
        pathname.startsWith('/revision') ||
        pathname.startsWith('/self-test') ||
        pathname.startsWith('/mutashabihat'),
    },
    {
      href: '/progress',
      label: copy.navProgress,
      icon: User,
      active: pathname.startsWith('/progress') || pathname.startsWith('/settings'),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 py-2.5">
          <Link
            href="/"
            className="flex min-h-[44px] items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
            aria-label={copy.brandName}
          >
            <img
              src="/images/al-milla-logo.png"
              alt={copy.brandName}
              className="h-10 w-10 rounded-xl border border-border/80 object-cover shadow-2xs"
            />
            <div className="leading-tight">
              <span className="block text-base font-bold text-primary">{copy.brandName}</span>
              <span className="block text-xs font-medium text-muted-foreground">{title}</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {isOffline && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                <WifiOff className="h-3 w-3" aria-hidden="true" />
                <span className="hidden sm:inline">{copy.offlineLabel}</span>
              </span>
            )}

            {!hideTopActions && (
              <Link
                href="/mushaf"
                className={cn(
                  'inline-flex h-10 items-center gap-1.5 rounded-xl border px-3.5 text-xs font-bold transition-colors',
                  pathname.startsWith('/mushaf')
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:bg-secondary',
                )}
                aria-label={copy.mushafLink}
              >
                <MushafIcon className="h-4 w-4" />
                <span>{copy.mushafLink}</span>
              </Link>
            )}

            {!hideTopActions && (
              <Link
                href="/settings"
                className={cn(
                  'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors',
                  pathname.startsWith('/settings')
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground hover:bg-secondary',
                )}
                aria-label={copy.settingsLink}
                title={copy.settingsLink}
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
        {subtitle && (
          <div className="mx-auto max-w-xl border-t border-border/50 px-4 py-1 text-[11px] text-muted-foreground">
            {subtitle}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={cn('mx-auto max-w-xl px-4 py-5', !hideBottomNav && 'pb-28')}>
        {children}
      </main>

      {/* Persistent 4-Destination Bottom Navigation */}
      {!hideBottomNav && (
        <nav
          aria-label="التنقل الرئيسي"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md"
        >
          <div className="mx-auto grid max-w-xl grid-cols-4 gap-1 px-2 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-medium transition-colors',
                    item.active
                      ? 'bg-secondary font-bold text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
