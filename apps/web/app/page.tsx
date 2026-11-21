'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  GitCompare,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';
import { AppShell } from '@/components/milla/AppShell';
import { HomeInstallButton } from '@/components/milla/InstallPwaBanner';
import { MushafIcon } from '@/components/milla/MushafIcon';
import { QuietDhikrCard } from '@/components/milla/QuietDhikrCard';
import { MILLA_COPY, formatNum, getSurahDisplayName } from '@/lib/milla-i18n';
import { getSurahById } from '@/lib/quran-data';
import {
  computeProgressMetrics,
  computeRevisionQueues,
  useMillaStore,
} from '@/store/milla-store';

export default function HomePage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  const onboardingCompleted = useMillaStore((s) => s.onboardingCompleted);
  const language = useMillaStore((s) => s.language);
  const dailyTarget = useMillaStore((s) => s.dailyTarget);
  const currentSurahId = useMillaStore((s) => s.currentSurahId);
  const currentAyah = useMillaStore((s) => s.currentAyah);
  const verseRecords = useMillaStore((s) => s.verseRecords);
  const activityDates = useMillaStore((s) => s.activityDates);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [hydrated, onboardingCompleted, router]);

  const copy = MILLA_COPY[language];
  const DirArrow = language === 'ar' ? ArrowLeft : ArrowRight;
  const surah = getSurahById(currentSurahId);
  const rangeEnd = Math.min(surah.totalAyahs, currentAyah + dailyTarget - 1);

  const memorizedInCurrentSurah = Object.values(verseRecords).filter(
    (r) => r.surahId === surah.id && (r.status === 'memorized' || r.status === 'weak'),
  ).length;
  const surahPct = Math.min(
    100,
    Math.round((memorizedInCurrentSurah / Math.max(1, surah.totalAyahs)) * 100),
  );

  const queues = computeRevisionQueues(verseRecords);
  const metrics = computeProgressMetrics(verseRecords, activityDates, currentSurahId);

  if (hydrated && !onboardingCompleted) {
    return null;
  }

  const shortcutItems = [
    { href: '/self-test', label: copy.selfTestTitle, icon: CheckCircle2 },
    { href: '/tafsir', label: copy.tafsirTitle, icon: Lightbulb },
    { href: '/mutashabihat', label: copy.mutashabihatTitle, icon: GitCompare },
    { href: '/progress', label: copy.progressTitle, icon: BarChart3 },
  ] as const;

  const shortcutsHeading =
    language === 'en' ? 'Quick Shortcuts' : language === 'fr' ? 'Accès rapides' : 'اختصارات سريعة';

  return (
    <AppShell title={copy.navHome} subtitle={copy.homeSubtitle}>
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-bold text-foreground">{copy.homeGreeting}</h1>
          <p className="mt-1 text-base text-muted-foreground">{copy.homeSubgreeting}</p>
        </section>

        {/* 1. Editorial Photo Hero for Today's Session */}
        <section className="relative overflow-hidden rounded-3xl bg-[#073d35] text-white shadow-sm">
          <img
            src="/images/mushaf-morning.jpg"
            alt={getSurahDisplayName(surah, language)}
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#073d35] via-[#073d35]/85 to-[#073d35]/65" />

          <div className="relative z-10 p-6">
            <div className="mb-3 flex items-center justify-between gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[#242a25]">
                {copy.homeTodayWird}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-white">
                {formatNum(Math.min(memorizedInCurrentSurah, dailyTarget), language)} /{' '}
                {formatNum(dailyTarget, language)} {copy.versesUnit}
              </span>
            </div>

            <h2 className="text-2xl font-bold">{getSurahDisplayName(surah, language)}</h2>
            <p className="mt-1 text-sm opacity-90 sm:text-base">
              {copy.ayahLabel} {formatNum(currentAyah, language)} - {formatNum(rangeEnd, language)} •{' '}
              {copy.hizbLabel} {formatNum(surah.hizb, language)}
            </p>

            {/* Current Surah Progress Bar with Warm Accent */}
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs opacity-90">
                <span>
                  {formatNum(memorizedInCurrentSurah, language)} /{' '}
                  {formatNum(surah.totalAyahs, language)} {copy.versesUnit}
                </span>
                <span className="font-bold text-accent">{formatNum(surahPct, language)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${surahPct}%` }}
                />
              </div>
            </div>

            <Link
              href="/memorize"
              className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-base font-bold text-[#073D35] shadow-xs transition-colors hover:bg-secondary"
            >
              <span>
                {queues.totalDueCount > 0 ? copy.homeContinueSessionCta : copy.homeContinueCta}
              </span>
              <DirArrow className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* 2. Clean Typographic Tracking Strip (no heavy boxes) */}
        <Link
          href="/progress"
          className="grid grid-cols-3 divide-x divide-border border-y border-border py-3.5 text-center transition-colors hover:bg-card/50 rtl:divide-x-reverse"
        >
          <div className="px-2">
            <p className="text-2xl font-bold text-primary">
              {formatNum(metrics.totalMemorizedVerses, language)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{copy.progressTotalLabel}</p>
          </div>
          <div className="px-2">
            <p className="text-2xl font-bold text-foreground">
              {formatNum(metrics.surahMasteryList.length, language)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{copy.progressActiveSurahs}</p>
          </div>
          <div className="px-2">
            <p className="text-2xl font-bold text-foreground">
              {formatNum(metrics.completedSurahsCount, language)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {copy.progressCompletedSurahs}
            </p>
          </div>
        </Link>

        {/* 3. Unified Today's Path (Revision + Memorize) */}
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          <Link
            href="/revision"
            className="flex min-h-[78px] items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
                {queues.totalDueCount > 0 && (
                  <span className="absolute -top-1 -end-1 h-3 w-3 rounded-full border-2 border-card bg-accent" />
                )}
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground">{copy.homeRevisionTitle}</h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {queues.totalDueCount > 0
                    ? `${formatNum(queues.totalDueCount, language)} ${copy.homeDueSummary} (${formatNum(queues.yesterdayItems.length, language)} ${copy.homeYesterdayShort} • ${formatNum(queues.olderDueItems.length, language)} ${copy.homeOlderShort} • ${formatNum(queues.weakItems.length, language)} ${copy.homeWeakShort})`
                    : copy.homeRevisionEmpty}
                </p>
              </div>
            </div>
            <DirArrow className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          </Link>

          <Link
            href="/memorize"
            className="flex min-h-[78px] items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground">{copy.homeNewMemTitle}</h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {getSurahDisplayName(surah, language)} • {copy.ayahLabel}{' '}
                  {formatNum(currentAyah, language)} - {formatNum(rangeEnd, language)}
                </p>
              </div>
            </div>
            <DirArrow className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          </Link>
        </div>

        {/* 4. Quick Shortcuts Pills */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-bold text-muted-foreground">{shortcutsHeading}</h2>
          <div className="flex flex-wrap gap-2">
            {shortcutItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-bold text-foreground transition-colors hover:border-accent hover:bg-accent/15"
                >
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 5. Quiet Interactive Dhikr with Editorial Photography */}
        <QuietDhikrCard />

        {/* 6. Mushaf & Install */}
        <div className="space-y-2.5">
          <Link
            href="/mushaf"
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/75 px-4 text-base font-bold text-primary transition-colors hover:bg-secondary"
          >
            <MushafIcon className="h-5 w-5" />
            <span>{copy.homeOpenMushaf}</span>
          </Link>

          <HomeInstallButton />
        </div>
      </div>
    </AppShell>
  );
}
