'use client';

import { useEffect } from 'react';
import { useMillaStore } from '@/store/milla-store';

export function ThemeSync() {
  const language = useMillaStore((s) => s.language);
  const nightMode = useMillaStore((s) => s.nightMode);
  const quranFontSize = useMillaStore((s) => s.quranFontSize);
  const largeUiMode = useMillaStore((s) => s.largeUiMode);

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
