'use client';

import { useState } from 'react';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { formatLandingNum, type LandingCopy, type LandingLang } from '@/lib/landing-copy';

interface LiveSessionPreviewProps {
  lang: LandingLang;
  copy: LandingCopy;
}

const SAMPLE_VERSES = [
  { number: 1, ar: 'بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ' },
  { number: 2, ar: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' },
  { number: 3, ar: 'الرَّحْمَـٰنِ الرَّحِيمِ' },
] as const;

const ARABIC_VERSE_DIGITS = ['١', '٢', '٣'] as const;

/**
 * Interactive preview of Al-Millah's 5-stage session directly on the landing page.
 */
export function LiveSessionPreview({ lang, copy }: LiveSessionPreviewProps) {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [hidden, setHidden] = useState<boolean>(false);
  const [rating, setRating] = useState<'difficult' | 'good' | 'easy' | null>(null);

  const stage = copy.stages[activeStage] ?? copy.stages[0];

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/70 pb-3">
        <span className="text-xs font-bold text-primary">{copy.previewHeader}</span>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          {formatLandingNum(activeStage + 1, lang)} / {formatLandingNum(5, lang)}
        </span>
      </div>

      {/* 5-Stage Interactive Stepper */}
      <div className="mb-4 grid grid-cols-5 gap-1.5">
        {copy.stages.map((item, idx) => {
          const isCurrent = idx === activeStage;
          const isDone = idx < activeStage;
          return (
            <button
              key={item.step}
              type="button"
              onClick={() => {
                setActiveStage(idx);
                setRating(null);
              }}
              className="flex flex-col items-center gap-1 text-center"
            >
              <span
                className={`h-2 w-full rounded-full transition-colors ${
                  isCurrent ? 'bg-accent' : isDone ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <span
                className={`line-clamp-1 text-[10px] ${
                  isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {item.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Stage Description */}
      <div className="mb-3">
        <p className="text-sm font-bold text-foreground">{stage.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{stage.desc}</p>
      </div>

      {/* Authentic Quranic Text Box */}
      <div
        className="rounded-2xl border border-border/80 bg-[#faf8f2] p-4 text-center"
        dir="rtl"
        lang="ar"
      >
        {hidden ? (
          <p className="py-5 text-xs font-medium text-muted-foreground" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {copy.previewHiddenHint}
          </p>
        ) : (
          <p className="quran-script text-xl text-foreground sm:text-2xl">
            {SAMPLE_VERSES.map((v, i) => (
              <span key={v.number}>
                {v.ar}{' '}
                <span className="mx-1 text-primary">﴿{ARABIC_VERSE_DIGITS[i]}﴾</span>{' '}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* Hide / Reveal Interactive Toggle */}
      <button
        type="button"
        onClick={() => setHidden((v) => !v)}
        className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground transition-colors hover:bg-secondary"
      >
        {hidden ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-primary" />}
        <span>{hidden ? copy.previewShowText : copy.previewHideText}</span>
      </button>

      {/* Calm Self-Eval Buttons */}
      <div className="mt-3 pt-3 border-t border-border/70">
        <p className="mb-2 text-[11px] font-semibold text-muted-foreground">
          {copy.previewEvalLabel}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {copy.previewRatings.map((item) => {
            const selected = rating === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRating(item.id)}
                className={`rounded-xl border px-2 py-2 text-center transition-colors ${
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:bg-secondary'
                }`}
              >
                <span className="block text-xs font-bold">{item.label}</span>
                <span className="block text-[10px] opacity-80">{item.hint}</span>
              </button>
            );
          })}
        </div>
        {rating && (
          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-primary">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{copy.previewEvalThanks}</span>
          </p>
        )}
      </div>
    </div>
  );
}
