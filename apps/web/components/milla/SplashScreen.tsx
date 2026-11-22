'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { AppLanguage } from '@/lib/milla-i18n';
import { useMillaStore } from '@/store/milla-store';

const SPLASH_SESSION_KEY = 'milla_splash_seen';

function getSplashCopy(language: AppLanguage) {
  if (language === 'en') {
    return {
      brand: 'Al-Millah',
      tagline: 'Your calm Quran memorization companion',
      verse: 'بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ',
    };
  }
  if (language === 'fr') {
    return {
      brand: 'Al-Millah',
      tagline: 'Votre compagnon serein pour mémoriser le Coran',
      verse: 'بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ',
    };
  }
  return {
    brand: 'المِلّة',
    tagline: 'رفيقك الهادئ لحفظ القرآن الكريم',
    verse: 'بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ',
  };
}

export function SplashScreen() {
  const language = useMillaStore((s) => s.language);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(SPLASH_SESSION_KEY) === '1') {
        return;
      }
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    } catch {
      // Ignore storage access errors in restricted modes
    }

    setVisible(true);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const holdMs = prefersReducedMotion ? 350 : 1150;
    const fadeMs = prefersReducedMotion ? 150 : 380;

    const fadeTimer = window.setTimeout(() => {
      setFadingOut(true);
    }, holdMs);

    const unmountTimer = window.setTimeout(() => {
      setVisible(false);
    }, holdMs + fadeMs);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(unmountTimer);
    };
  }, []);

  if (!visible) return null;

  const copy = getSplashCopy(language);

  const handleDismiss = () => {
    setFadingOut(true);
    window.setTimeout(() => setVisible(false), 260);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={copy.brand}
      onClick={handleDismiss}
      className={cn(
        'fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-between bg-[#073d35] px-6 py-12 text-[#f7f5ed] transition-opacity duration-300',
        fadingOut ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      <div className="h-6" aria-hidden="true" />

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-white/10 p-1.5 shadow-2xl">
          <img
            src="/icons/apple-touch-icon.png"
            alt={copy.brand}
            className="h-full w-full rounded-2xl object-cover"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-1.5 h-1.5 w-10 rounded-full bg-[#ff8e79]"
          />
        </div>

        <p className="quran-text mb-2 text-xl text-[#dce8e2]/90" dir="rtl" lang="ar">
          {copy.verse}
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-white">{copy.brand}</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#dce8e2]/80">{copy.tagline}</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="h-1 w-24 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-full origin-left animate-pulse rounded-full bg-[#ff8e79]" />
        </div>
        <span className="text-[11px] font-medium tracking-wide text-[#9fd0c5]/80">
          {language === 'en'
            ? 'Hafs an Asim'
            : language === 'fr'
              ? 'Hafs an Asim'
              : 'برواية حفص عن عاصم'}
        </span>
      </div>
    </div>
  );
}
