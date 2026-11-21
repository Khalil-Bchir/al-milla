'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppLanguage } from '@/lib/milla-i18n';
import { useMillaStore } from '@/store/milla-store';

export interface LanguageOption {
  id: AppLanguage;
  nativeLabel: string;
  shortLabel: string;
  dirLabel: 'RTL' | 'LTR';
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { id: 'ar', nativeLabel: 'العربية', shortLabel: 'عربي', dirLabel: 'RTL' },
  { id: 'en', nativeLabel: 'English', shortLabel: 'EN', dirLabel: 'LTR' },
  { id: 'fr', nativeLabel: 'Français', shortLabel: 'FR', dirLabel: 'LTR' },
] as const;

interface LanguageSwitcherProps {
  variant?: 'compact' | 'cards';
  className?: string;
}

function getSwitcherLabel(language: AppLanguage): string {
  if (language === 'en') return 'Choose language';
  if (language === 'fr') return 'Choisir la langue';
  return 'اختر اللغة';
}

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const language = useMillaStore((s) => s.language);
  const setLanguage = useMillaStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (variant === 'cards') {
    return (
      <div
        role="group"
        aria-label={getSwitcherLabel(language)}
        className={cn('grid grid-cols-3 gap-2.5', className)}
      >
        {LANGUAGE_OPTIONS.map((option) => {
          const active = language === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => setLanguage(option.id)}
              className={cn(
                'relative flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2.5 text-center transition-all',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                  : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-secondary/60',
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold">
                {active && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                <span>{option.nativeLabel}</span>
              </span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
                  active
                    ? 'bg-primary-foreground/15 text-primary-foreground'
                    : 'bg-secondary text-muted-foreground',
                )}
              >
                {option.dirLabel}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const current = LANGUAGE_OPTIONS.find((opt) => opt.id === language) ?? LANGUAGE_OPTIONS[0];

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${getSwitcherLabel(language)}: ${current.nativeLabel}`}
        className={cn(
          'inline-flex h-10 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-ring',
          open
            ? 'border-primary bg-secondary text-primary'
            : 'border-border bg-card text-foreground hover:bg-secondary',
        )}
      >
        <Globe className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <span>{current.shortLabel}</span>
        <ChevronDown
          className={cn('h-3 w-3 text-muted-foreground transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={getSwitcherLabel(language)}
          className="absolute end-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-lg"
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const active = language === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLanguage(option.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-start text-xs font-semibold transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-secondary/70',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="font-bold">{option.nativeLabel}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {option.dirLabel}
                  </span>
                </span>
                {active && <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
