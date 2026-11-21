'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import type { LandingLang } from '@/lib/landing-copy';

interface LandingLanguageOption {
  id: LandingLang;
  nativeLabel: string;
  shortLabel: string;
  dirLabel: 'RTL' | 'LTR';
}

const LANDING_LANGUAGES: readonly LandingLanguageOption[] = [
  { id: 'ar', nativeLabel: 'العربية', shortLabel: 'عربي', dirLabel: 'RTL' },
  { id: 'en', nativeLabel: 'English', shortLabel: 'EN', dirLabel: 'LTR' },
  { id: 'fr', nativeLabel: 'Français', shortLabel: 'FR', dirLabel: 'LTR' },
] as const;

interface LandingLanguageSwitcherProps {
  lang: LandingLang;
  onChange: (lang: LandingLang) => void;
  variant?: 'dropdown' | 'pills';
}

function getAriaLabel(lang: LandingLang): string {
  if (lang === 'en') return 'Select language';
  if (lang === 'fr') return 'Choisir la langue';
  return 'اختر اللغة';
}

export function LandingLanguageSwitcher({
  lang,
  onChange,
  variant = 'dropdown',
}: LandingLanguageSwitcherProps) {
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

  if (variant === 'pills') {
    return (
      <div
        role="group"
        aria-label={getAriaLabel(lang)}
        className="inline-flex items-center gap-1 rounded-xl border border-border bg-background/80 p-1"
      >
        <Globe className="mx-1.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        {LANDING_LANGUAGES.map((item) => {
          const active = lang === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(item.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.nativeLabel}
            </button>
          );
        })}
      </div>
    );
  }

  const current = LANDING_LANGUAGES.find((item) => item.id === lang) ?? LANDING_LANGUAGES[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${getAriaLabel(lang)}: ${current.nativeLabel}`}
        className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-colors ${
          open
            ? 'border-primary bg-secondary text-primary'
            : 'border-border bg-background/80 text-foreground hover:bg-secondary/70'
        }`}
      >
        <Globe className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <span>{current.shortLabel}</span>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={getAriaLabel(lang)}
          className="absolute end-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-lg"
        >
          {LANDING_LANGUAGES.map((item) => {
            const active = lang === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-start text-xs font-semibold transition-colors ${
                  active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary/70'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-bold">{item.nativeLabel}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {item.dirLabel}
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
