'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, HelpCircle, Lightbulb, Volume2 } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { cn } from '@/lib/utils';
import { MILLA_COPY, formatNum } from '@/lib/milla-i18n';
import { MUTASHABIHAT_DRILLS } from '@/lib/quran-data';
import { useMillaStore } from '@/store/milla-store';

export default function MutashabihatPage() {
  const drill = MUTASHABIHAT_DRILLS[0];
  const language = useMillaStore((s) => s.language);
  const copy = MILLA_COPY[language];
  const mutashabihatMastered = useMillaStore((s) => s.mutashabihatMastered);
  const setMutashabihatMastered = useMillaStore((s) => s.setMutashabihatMastered);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [playingSide, setPlayingSide] = useState<'primary' | 'secondary' | null>(null);

  const isMastered = Boolean(mutashabihatMastered[drill.id]);

  return (
    <AppShell title={copy.mutashabihatTitle} subtitle={copy.mutashabihatSubtitle}>
      <div className="space-y-5">
        {/* Comparison Header */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2 text-sm font-bold text-foreground">
            <span>{drill.primarySurahName}</span>
            <span className="text-muted-foreground">⇄</span>
            <span>{drill.secondarySurahName}</span>
          </div>
          <p className="mt-2 rounded-xl bg-accent/20 px-3 py-2 text-xs font-semibold text-foreground">
            موضع مزلّق شائع بين السورتين — يحتاج تمييزاً ذهنياً
          </p>
        </section>

        {/* Primary Verse */}
        <section className="rounded-2xl border-2 border-primary/40 bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-primary">
              {copy.mutashabihatPrimaryBadge} • {drill.primarySurahName}
            </span>
            <span className="text-xs text-muted-foreground">
              {copy.hizbLabel} {formatNum(drill.primaryHizb, language)}
            </span>
          </div>
          <p className="quran-text my-3 text-center text-foreground" dir="rtl" lang="ar">
            {drill.primaryText}
          </p>
          <p className="rounded-xl bg-secondary/60 p-3 text-xs leading-relaxed text-foreground">
            {drill.primaryNote}
          </p>
        </section>

        {/* Secondary Verse */}
        <section className="rounded-2xl border border-accent/60 bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-accent/25 px-2.5 py-0.5 text-xs font-bold text-foreground">
              {copy.mutashabihatSecondaryBadge} • {drill.secondarySurahName}
            </span>
            <span className="text-xs text-muted-foreground">
              {copy.hizbLabel} {formatNum(drill.secondaryHizb, language)}
            </span>
          </div>
          <p className="quran-text my-3 text-center text-foreground" dir="rtl" lang="ar">
            {drill.secondaryText}
          </p>
          <p className="text-xs text-muted-foreground">{drill.divergenceNote}</p>
        </section>

        {/* Mnemonic Rule */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">ضابط التمييز الذهني</h2>
          </div>
          <p className="text-sm font-bold text-primary">{drill.mnemonicTitle}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-foreground">{drill.mnemonicBody}</p>
        </section>

        {/* Audio Comparison */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold text-foreground">المقارنة الصوتية</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPlayingSide(playingSide === 'primary' ? null : 'primary')}
              className={cn(
                'flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold',
                playingSide === 'primary'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-secondary',
              )}
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>موضع الواقعة</span>
            </button>
            <button
              type="button"
              onClick={() => setPlayingSide(playingSide === 'secondary' ? null : 'secondary')}
              className={cn(
                'flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold',
                playingSide === 'secondary'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-secondary',
              )}
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>موضع الحاقة</span>
            </button>
          </div>
        </section>

        {/* Quick Recall Quiz */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-foreground">اختبار الاستحضار السريع</h2>
          </div>
          <p className="mb-3 text-sm text-foreground">{drill.quizPrompt}</p>

          <div className="space-y-2">
            {drill.quizOptions.map((opt) => {
              const isChosen = selectedOption === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOption(opt.id)}
                  className={cn(
                    'flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 text-sm font-bold transition-colors',
                    isChosen
                      ? opt.isCorrect
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-border bg-background text-foreground hover:bg-secondary',
                  )}
                >
                  <span className="font-quran text-lg">{opt.label}</span>
                  {isChosen && opt.isCorrect && <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          {selectedOption && (
            <p className="mt-3 rounded-xl bg-secondary/60 p-3 text-xs font-medium text-foreground">
              {drill.quizExplanation}
            </p>
          )}
        </section>

        {/* Mastered Toggle */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => setMutashabihatMastered(drill.id, !isMastered)}
            aria-pressed={isMastered}
            className={cn(
              'flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-colors',
              isMastered
                ? 'border border-primary bg-secondary text-primary'
                : 'bg-primary text-primary-foreground',
            )}
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <span>{isMastered ? 'تمّ تثبيت الموضع كـ «مُتقَن ومضبوط» ✓' : 'تثبيت الموضع كـ «مُتقَن ومضبوط»'}</span>
          </button>

          <Link
            href="/revision"
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            العودة لجدول المراجعة اليومية
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
