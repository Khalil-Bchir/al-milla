'use client';

import { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { formatNum } from '@/lib/milla-i18n';
import { useMillaStore } from '@/store/milla-store';

interface DhikrItem {
  ar: string;
  en: string;
  fr: string;
  target: number;
}

const ADHKAR: readonly DhikrItem[] = [
  {
    ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    en: 'Glory and praise be to Allah',
    fr: 'Gloire et louange à Allah',
    target: 33,
  },
  {
    ar: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    en: 'I seek Allah’s forgiveness and turn to Him',
    fr: 'Je demande pardon à Allah et je me repens à Lui',
    target: 33,
  },
  {
    ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    en: 'There is no might nor power except through Allah',
    fr: 'Il n’y a de force ni de puissance qu’en Allah',
    target: 33,
  },
  {
    ar: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
    en: 'O Allah, send peace and blessings upon our Prophet Muhammad',
    fr: 'Ô Allah, accorde paix et bénédictions à notre Prophète Muhammad',
    target: 10,
  },
];

export function QuietDhikrCard() {
  const language = useMillaStore((s) => s.language);
  const [dhikrIdx, setDhikrIdx] = useState(0);
  const [count, setCount] = useState(0);

  const item = ADHKAR[dhikrIdx] ?? ADHKAR[0];

  const labels =
    language === 'en'
      ? { title: 'Quiet Dhikr', next: 'Next', tapHint: 'Tap to count' }
      : language === 'fr'
        ? { title: 'Dhikr apaisant', next: 'Suivant', tapHint: 'Appuyez pour compter' }
        : { title: 'ذِكْرٌ هادئ', next: 'ذكر آخر', tapHint: 'اضغط للتسبيح' };

  const handleNext = () => {
    setDhikrIdx((i) => (i + 1) % ADHKAR.length);
    setCount(0);
  };

  const progressPct = Math.min(100, Math.round((count / item.target) * 100));

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
      <div className="relative h-24 w-full overflow-hidden">
        <img
          src="/images/quiet-study.jpg"
          alt={labels.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/55 to-transparent" />
        <div className="absolute inset-x-4 bottom-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/25 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            </span>
            <h2 className="text-sm font-bold text-foreground">{labels.title}</h2>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border border-border bg-card/90 px-3 text-xs font-semibold text-foreground backdrop-blur-xs transition-colors hover:bg-secondary"
          >
            <RefreshCw className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>{labels.next}</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="w-full p-4 pt-2 text-center transition-colors hover:bg-secondary/30 active:scale-[0.995]"
      >
        <p className="quran-text text-xl text-foreground sm:text-2xl" dir="rtl" lang="ar">
          {item.ar}
        </p>
        {language !== 'ar' && (
          <p className="mt-1 text-xs text-muted-foreground">
            {language === 'fr' ? item.fr : item.en}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[11px] font-medium text-muted-foreground">{labels.tapHint}</span>
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-[#242a25]">
            {formatNum(count, language)} / {formatNum(item.target, language)}
          </span>
        </div>

        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </button>
    </section>
  );
}
