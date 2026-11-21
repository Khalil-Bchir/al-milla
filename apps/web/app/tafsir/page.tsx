'use client';

import Link from 'next/link';
import { BookOpen, Info, Lightbulb, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { MILLA_COPY } from '@/lib/milla-i18n';
import { KAHF_TAFSIR_WORDS, getSurahById } from '@/lib/quran-data';
import { useMillaStore } from '@/store/milla-store';

export default function TafsirPage() {
  const language = useMillaStore((s) => s.language);
  const copy = MILLA_COPY[language];
  const kahf = getSurahById(18);

  return (
    <AppShell title={copy.tafsirTitle} subtitle={copy.tafsirSubtitle}>
      <div className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-primary">{copy.hafsBadge}</span>
          </div>

          <div className="rounded-2xl bg-secondary/50 p-4 text-center">
            <p className="quran-text text-foreground" dir="rtl" lang="ar">
              {kahf.ayahs[0].textAr} ﴿١﴾ {kahf.ayahs[1].textAr} ﴿٢﴾
            </p>
          </div>
        </section>

        <section className="flex items-start gap-2.5 rounded-2xl border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p>{copy.tafsirDisclaimer}</p>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-base font-bold text-foreground">{copy.tafsirWordsTitle}</h1>
          </div>

          <div className="space-y-2.5">
            {KAHF_TAFSIR_WORDS.map((item) => (
              <div key={item.word} className="rounded-xl bg-secondary/45 p-3.5">
                <span
                  className="inline-block rounded-lg bg-primary px-2.5 py-0.5 font-quran text-base font-bold text-primary-foreground"
                  dir="rtl"
                  lang="ar"
                >
                  {item.word}
                </span>
                <p className="mt-2 text-xs leading-relaxed text-foreground">
                  {language === 'en'
                    ? item.meaningEn
                    : language === 'fr'
                      ? item.meaningFr
                      : item.meaningAr}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">{copy.tafsirMentalAnchorTitle}</h2>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl bg-secondary/50 p-3.5 text-xs leading-relaxed text-foreground">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <p>
              {language === 'en'
                ? 'Connect the ending of verse 1 (“ʿiwajā”, no crookedness) directly to the beginning of verse 2 (“qayyiman”, straight).'
                : language === 'fr'
                  ? 'Reliez directement la fin du verset 1 (« ʿiwajā », sans tortuosité) au début du verset 2 (« qayyiman », droit).'
                  : 'حين تقف على رأس الآية الأولى «عِوَجًا» تذكّر أن بداية الآية الثانية تعلّة لما بعدها: «قَيِّمًا لِّيُنذِرَ».'}
            </p>
          </div>
        </section>

        <Link
          href="/self-test"
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:opacity-95"
        >
          {copy.tafsirGoSelfTest}
        </Link>
      </div>
    </AppShell>
  );
}
