'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Lock, Sparkles, Type, Volume2 } from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { LanguageSwitcher } from '@/components/milla/LanguageSwitcher';
import { MillaPicker } from '@/components/milla/MillaPicker';
import { cn } from '@/lib/utils';
import { MILLA_COPY, formatNum, getSurahDisplayName } from '@/lib/milla-i18n';
import { RECITERS, SURAHS, type ReciterId } from '@/lib/quran-data';
import { useMillaStore } from '@/store/milla-store';

export default function OnboardingPage() {
  const router = useRouter();
  const language = useMillaStore((s) => s.language);
  const reciter = useMillaStore((s) => s.reciter);
  const setReciter = useMillaStore((s) => s.setReciter);
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const setCurrentPosition = useMillaStore((s) => s.setCurrentPosition);
  const dailyTarget = useMillaStore((s) => s.dailyTarget);
  const setDailyTarget = useMillaStore((s) => s.setDailyTarget);
  const largeUiMode = useMillaStore((s) => s.largeUiMode);
  const setLargeUiMode = useMillaStore((s) => s.setLargeUiMode);
  const completeOnboarding = useMillaStore((s) => s.completeOnboarding);

  const [customGoalInput, setCustomGoalInput] = useState<string>(String(dailyTarget));
  const copy = MILLA_COPY[language];
  const DirArrow = language === 'ar' ? ArrowLeft : ArrowRight;

  const startingSurahPresets = [1, 78, 67, 18].map((id) => {
    const s = SURAHS.find((item) => item.id === id) ?? SURAHS[0];
    return {
      id: s.id,
      label: getSurahDisplayName(s, language),
      hint: `${formatNum(s.totalAyahs, language)} ${copy.versesUnit}`,
    };
  });

  const dailyGoals: { value: number; title: string; subtitle: string; recommended?: boolean }[] = [
    {
      value: 1,
      title: `${formatNum(1, language)} ${copy.verseSingular}`,
      subtitle:
        language === 'ar'
          ? 'للمبتدئين أو مع ضيق الوقت'
          : language === 'fr'
            ? 'Pour débuter en douceur'
            : 'For beginners or busy days',
    },
    {
      value: 2,
      title: `${formatNum(2, language)} ${copy.versesUnit}`,
      subtitle:
        language === 'ar'
          ? 'خطوة هادئة ومستقرة'
          : language === 'fr'
            ? 'Un rythme calme et régulier'
            : 'A calm, steady pace',
    },
    {
      value: 3,
      title: `${formatNum(3, language)} ${copy.versesUnit}`,
      subtitle:
        language === 'ar'
          ? 'توازن مناسب بين الحفظ والمراجعة'
          : language === 'fr'
            ? 'Bon équilibre mémorisation / révision'
            : 'Balanced pace for memorization & review',
      recommended: true,
    },
    {
      value: 5,
      title: `${formatNum(5, language)} ${copy.versesUnit}`,
      subtitle:
        language === 'ar'
          ? 'للمعتادين على الحفظ اليومي'
          : language === 'fr'
            ? 'Pour les habitués'
            : 'For experienced daily learners',
    },
  ];

  const handleStart = () => {
    completeOnboarding();
    router.push('/');
  };

  return (
    <AppShell title={copy.onboardingTitle} hideBottomNav hideTopActions>
      <div className="space-y-5 py-2">
        {/* Top Controls: Large Text & Language */}
        <div className="space-y-3">
          <LanguageSwitcher variant="cards" />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setLargeUiMode(!largeUiMode)}
              aria-pressed={largeUiMode}
              className={cn(
                'inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-xs font-semibold transition-colors',
                largeUiMode
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-secondary',
              )}
            >
              <Type className="h-4 w-4" aria-hidden="true" />
              <span>{copy.onboardingLargeText}</span>
            </button>
          </div>
        </div>

        {/* Brand Identity */}
        <section className="text-center">
          <img
            src="/images/al-milla-logo.png"
            alt={copy.brandName}
            className="mx-auto h-20 w-20 rounded-2xl border border-border object-cover shadow-xs"
          />
          <h1 className="mt-3 text-3xl font-bold text-primary">{copy.brandName}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {copy.onboardingIntro}
          </p>
        </section>

        {/* 1. Preferred Sheikh */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Volume2 className="h-5 w-5 text-primary" aria-hidden="true" />
              <span>{copy.onboardingReciterTitle}</span>
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {copy.hafsBadge}
            </span>
          </div>

          <MillaPicker
            value={reciter}
            onChange={(val) => setReciter(val as ReciterId)}
            title={copy.onboardingReciterPickerTitle}
            ariaLabel={copy.onboardingReciterPickerTitle}
            options={RECITERS.map((r) => ({
              value: r.id,
              label: language === 'ar' ? r.nameAr : r.nameEn,
              description: language === 'ar' ? r.styleAr : r.nameAr,
              keywords: `${r.nameAr} ${r.nameEn}`,
            }))}
          />
        </section>

        {/* 2. Starting Surah */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
              <span>{copy.onboardingSurahTitle}</span>
            </h2>
            <MillaPicker
              compact
              searchable
              value={String(currentSurahId)}
              onChange={(val) => setCurrentPosition(Number(val), 1)}
              title={copy.onboardingSurahPickerTitle}
              ariaLabel={copy.onboardingSurahPickerTitle}
              options={SURAHS.map((s) => ({
                value: String(s.id),
                label: `${formatNum(s.id, language)}. ${getSurahDisplayName(s, language)}`,
                description: `${formatNum(s.totalAyahs, language)} ${copy.versesUnit}`,
                keywords: `${s.nameAr} ${s.nameEn} ${s.nameFr}`,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {startingSurahPresets.map((preset) => {
              const selected = currentSurahId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setCurrentPosition(preset.id, 1)}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-[64px] flex-col items-start justify-between rounded-xl border p-3 text-start transition-colors',
                    selected
                      ? 'border-primary bg-secondary/70'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  <span className="text-sm font-bold text-foreground">{preset.label}</span>
                  <span className="text-xs text-muted-foreground">{preset.hint}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Daily Goal */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              <span>{copy.onboardingGoalTitle}</span>
            </h2>
            <span className="text-xs text-muted-foreground">{copy.onboardingGoalLater}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {dailyGoals.map((goal) => {
              const selected = dailyTarget === goal.value;
              return (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => {
                    setDailyTarget(goal.value);
                    setCustomGoalInput(String(goal.value));
                  }}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-[68px] flex-col items-start justify-between rounded-xl border p-3 text-start transition-colors',
                    selected
                      ? 'border-primary bg-secondary/70'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground">{goal.title}</span>
                    {goal.recommended && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {copy.onboardingRecommended}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">{goal.subtitle}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
            <label htmlFor="custom-daily-goal" className="text-xs font-bold text-foreground">
              {copy.onboardingCustomGoalLabel}
            </label>
            <input
              id="custom-daily-goal"
              type="number"
              min={1}
              max={20}
              value={customGoalInput}
              onChange={(e) => {
                const val = e.target.value;
                setCustomGoalInput(val);
                const num = Number(val);
                if (Number.isInteger(num) && num >= 1 && num <= 20) {
                  setDailyTarget(num);
                }
              }}
              className="h-10 w-20 rounded-lg border border-border bg-card px-2 text-center text-sm font-bold text-foreground"
            />
          </div>
        </section>

        {/* Privacy & Start CTA */}
        <div className="space-y-3 text-center">
          <p className="flex items-start justify-center gap-1.5 rounded-xl bg-secondary/50 p-3 text-start text-xs leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span>{copy.onboardingPrivacyNote}</span>
          </p>

          <button
            type="button"
            onClick={handleStart}
            className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-95"
          >
            <span>{copy.onboardingStartCta}</span>
            <DirArrow className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
