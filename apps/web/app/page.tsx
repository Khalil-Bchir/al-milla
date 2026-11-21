'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
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
      <div className="space-y-5">
        <section>
          <h1 className="text-2xl font-bold text-foreground">{copy.homeGreeting}</h1>
          <p className="mt-1 text-base text-muted-foreground">{copy.homeSubgreeting}</p>
        </section>

        {/* 1. Primary Daily Session Hero */}
        <section className="rounded-2xl bg-primary p-6 text-primary-foreground">
          <div className="mb-3 flex items-center justify-between gap-2 text-sm opacity-90">
            <span>{copy.homeTodayWird}</span>
            <span>
              {formatNum(Math.min(memorizedInCurrentSurah, dailyTarget), language)} /{' '}
              {formatNum(dailyTarget, language)} {copy.versesUnit}
            </span>
          </div>

          <h2 className="text-2xl font-bold">{getSurahDisplayName(surah, language)}</h2>
          <p className="mt-1 text-base opacity-90">
            {copy.ayahLabel} {formatNum(currentAyah, language)} - {formatNum(rangeEnd, language)} •{' '}
            {copy.hizbLabel} {formatNum(surah.hizb, language)}
          </p>

          {/* Current Surah Progress Bar */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs opacity-85">
              <span>
                {formatNum(memorizedInCurrentSurah, language)} /{' '}
                {formatNum(surah.totalAyahs, language)} {copy.versesUnit}
              </span>
              <span>{formatNum(surahPct, language)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-300"
                style={{ width: `${surahPct}%` }}
              />
            </div>
          </div>

          <Link
            href="/memorize"
            className="mt-5 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-base font-bold text-[#073D35] transition-colors hover:bg-secondary"
          >
            <span>
              {queues.totalDueCount > 0 ? copy.homeContinueSessionCta : copy.homeContinueCta}
            </span>
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
        </section>

        {/* 2. Live Memorization Tracking Strip */}
        <Link
          href="/progress"
          className="grid grid-cols-3 gap-2.5 rounded-2xl border border-border bg-card p-3.5 text-center transition-colors hover:bg-secondary/40"
        >
          <div className="rounded-xl bg-secondary/45 p-2.5">
            <p className="text-[11px] text-muted-foreground">{copy.progressTotalLabel}</p>
            <p className="mt-1 text-lg font-bold text-primary">
              {formatNum(metrics.totalMemorizedVerses, language)}
            </p>
          </div>
          <div className="rounded-xl bg-secondary/45 p-2.5">
            <p className="text-[11px] text-muted-foreground">{copy.progressActiveSurahs}</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatNum(metrics.surahMasteryList.length, language)}
            </p>
          </div>
          <div className="rounded-xl bg-secondary/45 p-2.5">
            <p className="text-[11px] text-muted-foreground">{copy.progressCompletedSurahs}</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatNum(metrics.completedSurahsCount, language)}
            </p>
          </div>
        </Link>

        {/* 3. Today's Revision & New Memorization */}
        <div className="space-y-3">
          <Link
            href="/revision"
            className="flex min-h-[80px] items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground">{copy.homeRevisionTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  {queues.totalDueCount > 0
                    ? `${formatNum(queues.totalDueCount, language)} ${copy.homeDueSummary} (${formatNum(queues.yesterdayItems.length, language)} ${copy.homeYesterdayShort} • ${formatNum(queues.olderDueItems.length, language)} ${copy.homeOlderShort} • ${formatNum(queues.weakItems.length, language)} ${copy.homeWeakShort})`
                    : copy.homeRevisionEmpty}
                </p>
              </div>
            </div>
            <ArrowLeft className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          </Link>

          <Link
            href="/memorize"
            className="flex min-h-[80px] items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground">{copy.homeNewMemTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  {getSurahDisplayName(surah, language)} • {copy.ayahLabel}{' '}
                  {formatNum(currentAyah, language)} - {formatNum(rangeEnd, language)}
                </p>
              </div>
            </div>
            <ArrowLeft className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          </Link>
        </div>

        {/* 4. Quick Shortcuts Grid */}
        <section className="space-y-2.5">
          <h2 className="text-sm font-bold text-muted-foreground">{shortcutsHeading}</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {shortcutItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-[60px] items-center gap-2.5 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:bg-secondary/50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold text-foreground sm:text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 5. Quiet Interactive Dhikr */}
        <QuietDhikrCard />

        {/* 6. Mushaf & Install */}
        <div className="space-y-2.5">
          <Link
            href="/mushaf"
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/70 px-4 text-base font-bold text-primary transition-colors hover:bg-secondary"
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
