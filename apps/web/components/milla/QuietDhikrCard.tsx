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
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-bold text-foreground">{labels.title}</h2>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{labels.next}</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setCount((c) => c + 1)}
        className="w-full rounded-2xl border border-border/80 bg-secondary/40 p-4 text-center transition-colors hover:bg-secondary/70 active:scale-[0.99]"
      >
        <p className="quran-text text-xl text-foreground sm:text-2xl" dir="rtl" lang="ar">
          {item.ar}
        </p>
        {language !== 'ar' && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {language === 'fr' ? item.fr : item.en}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[11px] font-medium text-muted-foreground">{labels.tapHint}</span>
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
            {formatNum(count, language)} / {formatNum(item.target, language)}
          </span>
        </div>

        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </button>
    </section>
  );
}
