'use client';

import { useEffect } from 'react';
import type { AppLanguage } from '@/lib/milla-i18n';
import { useMillaStore } from '@/store/milla-store';

function isSupportedLanguage(value: string | null): value is AppLanguage {
  return value === 'ar' || value === 'en' || value === 'fr';
}

export function ThemeSync() {
  const language = useMillaStore((s) => s.language);
  const setLanguage = useMillaStore((s) => s.setLanguage);
  const nightMode = useMillaStore((s) => s.nightMode);
  const quranFontSize = useMillaStore((s) => s.quranFontSize);
  const largeUiMode = useMillaStore((s) => s.largeUiMode);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (isSupportedLanguage(urlLang)) {
        setLanguage(urlLang);
        params.delete('lang');
        const nextQuery = params.toString();
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
        window.history.replaceState(null, '', nextUrl);
      }
    } catch {
      // Ignore URL parsing errors in restricted environments
    }
  }, [setLanguage]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    root.classList.toggle('dark', nightMode);
    root.style.setProperty('--quran-font-scale', `${quranFontSize}px`);
    root.style.fontSize = largeUiMode ? '18px' : '16px';
  }, [language, nightMode, quranFontSize, largeUiMode]);

  return null;
}
